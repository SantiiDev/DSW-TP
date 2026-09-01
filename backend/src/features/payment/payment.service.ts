// Lógica de negocio del pago de una membresía: arrancar el checkout y confirmar
// el resultado. No conoce req ni res.
//
// El circuito completo del CUU de upgrade:
//
//   1. El usuario aprieta "Pasarme a Pro"  -> createCheckout() arma la orden en
//      MercadoPago y devuelve el link. Todavía NO se guarda nada en la base: un
//      checkout empezado no es una membresía.
//   2. Paga en MercadoPago.
//   3. MercadoPago avisa. Puede avisar por DOS caminos, y los dos terminan en
//      confirmPayment():
//        - el webhook, que es el aviso servidor-a-servidor;
//        - la pantalla de retorno, cuando el navegador del usuario vuelve al sitio.
//      Los dos pueden llegar, en cualquier orden, o puede llegar uno solo. Por eso
//      confirmPayment() es idempotente: el segundo en llegar no duplica nada.
//   4. confirmPayment() le pregunta a MercadoPago cómo terminó el pago y, si está
//      aprobado, activa la membresía y registra el pago EN UNA TRANSACCIÓN.
//
// Por qué se persiste solo el pago aprobado: PAYMENTS.id_subscription es NOT NULL,
// así que un pago no puede existir sin una suscripción, y SUBSCRIPTION no tiene un
// estado 'pending' donde dejarla esperando. Guardar los rechazos obligaría a crear
// una suscripción que nunca estuvo vigente. Un rechazo, entonces, no deja fila: el
// usuario lo ve en la pantalla de retorno y puede volver a intentar.
import { sequelize } from '../../shared/db/sequelize';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error';
import { planRepository } from '../plan/plan.repository';
import { subscriptionService } from '../subscription/subscription.service';
import { userRepository } from '../user/user.repository';
import { parseExternalReference, paymentGateway } from './payment.gateway';
import { paymentRepository, PaymentWithSubscription } from './payment.repository';

/** Estado con el que MercadoPago informa un pago aceptado. */
const APPROVED_STATUS = 'approved';

/** Lo que devuelve el arranque del checkout: a dónde mandar al usuario. */
type CheckoutResult = {
  checkoutUrl: string;
  preferenceId: string;
};

/**
 * Resultado de confirmar un pago. `applied` distingue los dos finales felices:
 * true  -> este llamado activó la membresía;
 * false -> el pago ya estaba registrado (llegó el aviso duplicado) o no se aprobó.
 */
type ConfirmResult = {
  applied: boolean;
  status: string;
  message: string;
};

/** Vista pública de un pago: es lo que sale en el historial del perfil. */
type PublicPayment = {
  id_transaction: number;
  amount: number;
  payment_date: Date;
  state: string;
  plan: string | null;
};

/** Arma la vista pública de un pago. */
function toPublicPayment(payment: PaymentWithSubscription): PublicPayment {
  return {
    id_transaction: payment.id_transaction,
    // El getter de la entidad ya lo devuelve como número: la columna es un
    // DECIMAL y sin él llegaría como string.
    amount: payment.amount,
    payment_date: payment.payment_date,
    state: payment.state,
    plan: payment.subscription?.plan?.name ?? null,
  };
}

export const paymentService = {
  /**
   * Arranca el pago de un plan: crea la orden en MercadoPago y devuelve el link
   * del checkout.
   *
   * @param id_user usuario que quiere contratar, sacado del token.
   * @param id_plan plan elegido.
   * @returns la URL a la que hay que mandar al usuario.
   */
  async createCheckout(id_user: number, id_plan: number): Promise<CheckoutResult> {
    const plan = await planRepository.findById(id_plan);
    if (!plan) throw new NotFoundError('El plan');

    // El plan gratuito no se cobra: mandar a alguien a pagar $0 haría que
    // MercadoPago rechace la preference con un error que no se entiende.
    if (plan.amount <= 0) {
      throw new BadRequestError(
        `El plan "${plan.name}" no tiene costo, así que no hace falta pagarlo.`
      );
    }

    const user = await userRepository.findById(id_user);
    if (!user) throw new NotFoundError('El usuario');

    // No se corta si el usuario ya es PRO: eso es una RENOVACIÓN, que es
    // justamente como se mantiene viva una membresía mensual. Al confirmarse, la
    // suscripción anterior se cancela y arranca una nueva por un mes más.
    return paymentGateway.createPreference({
      title: `Musicboxd — Membresía ${plan.name}`,
      amount: plan.amount,
      externalReference: `${id_user}:${id_plan}`,
      payerEmail: user.email,
    });
  },

  /**
   * Confirma un pago contra MercadoPago y, si está aprobado, activa la membresía.
   *
   * Es el único lugar donde una membresía se vuelve efectiva, y lo llaman los dos
   * caminos de aviso (webhook y pantalla de retorno). Tres cuidados que lo hacen
   * seguro:
   *
   *  - NO confía en quien avisa. El aviso solo trae un id; el estado del pago se
   *    consulta contra MercadoPago con nuestro access token. Si no fuera así,
   *    cualquiera podría hacerse PRO mandando un POST inventado al webhook.
   *  - Es idempotente. Si el pago ya está registrado, no vuelve a activar nada;
   *    y aunque dos avisos entraran a la vez, el índice único de id_gateway
   *    haría fallar al segundo antes de duplicar la membresía.
   *  - Es todo o nada. La suscripción, el rol del usuario y el pago se guardan en
   *    una transacción.
   *
   * @param gatewayPaymentId id del pago en MercadoPago.
   * @returns si este llamado aplicó la membresía, y el estado informado.
   */
  async confirmPayment(gatewayPaymentId: string): Promise<ConfirmResult> {
    const payment = await paymentGateway.getPayment(gatewayPaymentId);

    if (!payment) {
      throw new NotFoundError('El pago informado');
    }

    if (payment.status !== APPROVED_STATUS) {
      // Ni error ni activación: el pago existe pero no prosperó. La pantalla de
      // retorno usa este estado para explicarle al usuario qué pasó.
      return {
        applied: false,
        status: payment.status,
        message: 'El pago todavía no está aprobado, así que la membresía sigue igual.',
      };
    }

    // ¿Ya lo habíamos registrado? Pasa siempre que lleguen los dos avisos.
    const existing = await paymentRepository.findByGatewayId(payment.id);
    if (existing) {
      return {
        applied: false,
        status: payment.status,
        message: 'Este pago ya estaba registrado y la membresía ya estaba activa.',
      };
    }

    const { id_user, id_plan } = parseExternalReference(payment.externalReference);

    await sequelize.transaction(async (t) => {
      // Activar cancela la suscripción anterior, crea la nueva por un mes y deja
      // al usuario como PRO. Todo eso vive en subscription.service, que es el
      // dueño de la regla "el rol refleja la suscripción vigente".
      const subscription = await subscriptionService.activate(id_user, id_plan, t);

      await paymentRepository.create(
        {
          // El importe que se guarda es el que COBRÓ la pasarela, no el precio
          // que tiene hoy el plan: si mañana cambia, el historial tiene que
          // seguir mostrando lo que se pagó en su momento.
          amount: payment.amount,
          state: 'approved',
          id_gateway: payment.id,
          id_subscription: subscription.id_subscription,
        },
        t
      );
    });

    return {
      applied: true,
      status: payment.status,
      message: '¡Listo! Tu membresía Pro quedó activa.',
    };
  },

  /**
   * Historial de pagos de un usuario.
   * @param id_user usuario sacado del token.
   */
  async getMine(id_user: number): Promise<PublicPayment[]> {
    const payments = await paymentRepository.findAllByUser(id_user);
    return payments.map(toPublicPayment);
  },
};
