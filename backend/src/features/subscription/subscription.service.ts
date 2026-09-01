// Lógica de negocio de las membresías: cuál es la vigente de un usuario, cómo se
// activa una nueva y cómo se da de baja. No conoce req ni res.
//
// Este service es el ÚNICO lugar donde cambia el rol de un usuario por motivos de
// membresía. La regla que sostiene todo el circuito es:
//
//   el rol del usuario refleja su suscripción vigente.
//
// Por eso activar, cancelar y vencer una suscripción tocan siempre las dos cosas
// juntas y dentro de una transacción: si se guardara solo una, quedaría un Pro
// sin suscripción o un Free pagando.
//
// El rol ADMIN queda afuera de esa regla: no se compra ni se pierde por vencer
// una membresía, se asigna desde el seed o desde el panel. Un ADMIN puede tener
// una suscripción como cualquiera, pero su rol no lo determina ella.
import { Transaction } from 'sequelize';
import { sequelize } from '../../shared/db/sequelize';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error';
import { SubscriptionState, UserRole } from '../../shared/types/enums';
import { planRepository, PlanWithSubscriptions } from '../plan/plan.repository';
import { subscriptionRepository, SubscriptionWithPlan } from './subscription.repository';
import { ListSubscriptionsQuery } from './subscription.schema';

/**
 * Cuánto dura una membresía paga. Un mes calendario, que es lo que se le cobra al
 * usuario en el checkout.
 */
const MEMBERSHIP_MONTHS = 1;

/**
 * Nombre del plan pago. El id NO se hardcodea porque depende de en qué orden se
 * corrió el seed; el nombre, en cambio, es parte del modelo de negocio y tiene un
 * índice único que garantiza que haya uno solo.
 */
export const PRO_PLAN_NAME = 'Pro';

/** Vista pública de una suscripción: es lo que sale en el perfil y en el panel. */
type PublicSubscription = {
  id_subscription: number;
  plan: { id_plan: number; name: string; amount: number } | null;
  subscription_date: Date;
  end_date: Date | null;
  state: SubscriptionState;
  /** El usuario dueño de la suscripción. Solo lo llena el listado de ADMIN. */
  user?: { id_user: number; username: string; email: string } | null;
};

/**
 * "Mi membresía": la vigente y todo el historial.
 * `current` es null en un usuario que nunca contrató nada, que es el caso de
 * cualquiera recién registrado.
 */
type MyMembership = {
  current: PublicSubscription | null;
  history: PublicSubscription[];
};

/** Arma la vista pública de una suscripción. */
function toPublicSubscription(subscription: SubscriptionWithPlan): PublicSubscription {
  return {
    id_subscription: subscription.id_subscription,
    plan: subscription.plan
      ? {
          id_plan: subscription.plan.id_plan,
          name: subscription.plan.name,
          // El getter de la entidad ya lo devuelve como número: la columna es un
          // DECIMAL y sin él llegaría como string.
          amount: subscription.plan.amount,
        }
      : null,
    subscription_date: subscription.subscription_date,
    end_date: subscription.end_date ?? null,
    state: subscription.state,
    ...(subscription.user && {
      user: {
        id_user: subscription.user.id_user,
        username: subscription.user.username,
        email: subscription.user.email,
      },
    }),
  };
}

/**
 * Calcula hasta cuándo vale una membresía que arranca ahora.
 * @returns la fecha de vencimiento, un mes más adelante.
 */
function calculateEndDate(from: Date): Date {
  const end = new Date(from);
  // setMonth resuelve solo los meses de distinto largo: un alta el 31 de enero
  // vence el 28 (o 29) de febrero, no el 3 de marzo.
  end.setMonth(end.getMonth() + MEMBERSHIP_MONTHS);
  return end;
}

/**
 * ¿Esta suscripción ya venció?
 *
 * Una membresía sin end_date no vence nunca: es el caso del plan Free.
 */
function isDue(subscription: SubscriptionWithPlan): boolean {
  return subscription.end_date !== null && subscription.end_date <= new Date();
}

/**
 * Baja el rol de un usuario a FREE, salvo que sea ADMIN.
 *
 * Es el cuidado que evita que perder una membresía degrade a un administrador:
 * si un ADMIN contrata Pro y después lo cancela, tiene que seguir siendo ADMIN.
 */
async function downgradeRole(
  id_user: number,
  currentRole: UserRole,
  transaction?: Transaction
): Promise<void> {
  if (currentRole === 'ADMIN') return;
  await subscriptionRepository.updateUserRole(id_user, 'FREE', transaction);
}

export const subscriptionService = {
  /**
   * La membresía vigente de un usuario, ya con el vencimiento aplicado.
   *
   * El vencimiento se resuelve acá, de forma perezosa, y no con una tarea que
   * corra sola en el tiempo: el sistema no tiene un scheduler, y agregarlo por
   * esto sería desproporcionado. Como toda lectura de la membresía pasa por esta
   * función, una suscripción vencida nunca llega a mostrarse como activa.
   *
   * @param id_user usuario dueño de la membresía, sacado del token.
   * @param currentRole rol que tiene hoy, para no degradar a un ADMIN.
   * @returns la suscripción vigente, o null si no tiene o si la que tenía venció.
   */
  async getActive(id_user: number, currentRole: UserRole): Promise<SubscriptionWithPlan | null> {
    const active = await subscriptionRepository.findActiveByUser(id_user);
    if (!active) return null;

    if (isDue(active)) {
      // Venció: se registra como 'expired' (y no 'cancelled', que es la baja
      // voluntaria) y el usuario vuelve a FREE.
      await sequelize.transaction(async (t) => {
        await subscriptionRepository.updateState(active, 'expired', t);
        await downgradeRole(id_user, currentRole, t);
      });
      return null;
    }

    return active;
  },

  /**
   * "Mi membresía": la vigente más el historial completo.
   * @param id_user usuario sacado del token.
   * @param currentRole rol actual, para el chequeo de vencimiento.
   */
  async getMine(id_user: number, currentRole: UserRole): Promise<MyMembership> {
    // Se pide primero la vigente porque es la que puede vencer, y el vencimiento
    // cambia el estado que después va a leer el historial.
    const current = await subscriptionService.getActive(id_user, currentRole);
    const history = await subscriptionRepository.findAllByUser(id_user);

    return {
      current: current ? toPublicSubscription(current) : null,
      history: history.map(toPublicSubscription),
    };
  },

  /**
   * Activa una membresía paga para un usuario y lo deja como PRO.
   *
   * Es el corazón del CUU de upgrade, y lo llama el circuito de pago una vez que
   * la pasarela confirmó la operación. Recibe la transacción desde afuera porque
   * el pago se registra en la misma: o queda todo (suscripción + rol + pago) o no
   * queda nada.
   *
   * La suscripción anterior se pasa a 'cancelled' dentro de la misma transacción.
   * Es lo que garantiza que haya UNA SOLA activa por usuario: MySQL no soporta
   * índices únicos parciales, así que esa regla no la puede sostener la base y la
   * tiene que sostener este código (ver la nota en subscription.entity.ts).
   *
   * @param id_user usuario que contrató.
   * @param id_plan plan contratado.
   * @param transaction la transacción abierta por quien llama.
   * @returns la suscripción recién activada.
   */
  async activate(
    id_user: number,
    id_plan: number,
    transaction: Transaction
  ): Promise<SubscriptionWithPlan> {
    const previous = await subscriptionRepository.findActiveByUser(id_user, transaction);
    if (previous) {
      await subscriptionRepository.updateState(previous, 'cancelled', transaction);
    }

    const now = new Date();
    const subscription = await subscriptionRepository.create(
      { id_user, id_plan, end_date: calculateEndDate(now) },
      transaction
    );

    await subscriptionRepository.updateUserRole(id_user, 'PRO', transaction);

    return subscription;
  },

  /**
   * Da de baja la membresía vigente de un usuario.
   *
   * La baja es inmediata: la suscripción queda 'cancelled' y el usuario vuelve a
   * FREE en el acto, sin conservar los beneficios hasta el vencimiento. Es la
   * regla más simple de explicar y la que no necesita ningún proceso corriendo en
   * el tiempo para hacerse efectiva.
   *
   * @param id_user usuario sacado del token.
   * @param currentRole rol actual, para no degradar a un ADMIN.
   */
  async cancelMine(id_user: number, currentRole: UserRole): Promise<PublicSubscription> {
    const active = await subscriptionService.getActive(id_user, currentRole);

    // Si no hay ninguna activa no hay nada que dar de baja. Es un 400 y no un 404
    // porque el recurso "mi membresía" existe: lo que no se puede es la acción.
    if (!active) {
      throw new BadRequestError('No tenés ninguna membresía activa para dar de baja.');
    }

    await sequelize.transaction(async (t) => {
      await subscriptionRepository.updateState(active, 'cancelled', t);
      await downgradeRole(id_user, currentRole, t);
    });

    return toPublicSubscription(active);
  },

  /**
   * Listado de todas las suscripciones del sistema. Solo ADMIN, que es lo que
   * corta requireRole en la ruta.
   * @param filters id_user y state que hayan llegado por query string.
   */
  async list(filters: ListSubscriptionsQuery): Promise<PublicSubscription[]> {
    const subscriptions = await subscriptionRepository.findAll({
      id_user: filters.id_user,
      state: filters.state,
    });

    return subscriptions.map(toPublicSubscription);
  },

  /**
   * Busca el plan Pro por su nombre. Lo usa el checkout para saber qué se está
   * cobrando sin tener el id hardcodeado.
   * @throws 404 si el seed de planes no se corrió.
   */
  async getProPlan(): Promise<PlanWithSubscriptions> {
    const plan = await planRepository.findByName(PRO_PLAN_NAME);

    if (!plan) {
      throw new NotFoundError(
        `El plan "${PRO_PLAN_NAME}". Hay que correr el seed de planes (npm run seed:plans)`
      );
    }

    return plan;
  },
};
