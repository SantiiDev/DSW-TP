// Acceso a datos de la feature plan: consultas a la tabla plan para el CRUD de
// los planes de membresía. Es la única capa que habla con Sequelize.
import { Plan, Subscription } from '../../entities';
import { SubscriptionState } from '../../shared/types/enums';

/**
 * Suscripción reducida a lo mínimo: alcanza para saber cuántos usuarios tiene
 * enganchados un plan y si alguno sigue vigente, que es lo único que necesita la
 * baja para decidir si puede seguir.
 */
export type PlanSubscription = {
  id_subscription: number;
  state: SubscriptionState;
};

/** Plan reducido a lo que hace falta para comparar nombres entre sí. */
export type PlanNameRow = {
  id_plan: number;
  name: string;
};

/**
 * Plan tal como sale de este repositorio: con las suscripciones que lo apuntan,
 * cuando la consulta las trajo (todas menos el alta, que crea un plan al que
 * todavía no se suscribió nadie).
 *
 * `subscriptions` no está declarada en plan.entity.ts porque las entidades son
 * compartidas por todas las features y no se tocan desde una sola. Se la agrega
 * acá, que es la capa que sabe cómo está armada la consulta.
 */
export type PlanWithSubscriptions = Plan & {
  subscriptions?: PlanSubscription[];
};

/** Datos del alta: el nombre y el monto son obligatorios, la descripción no. */
type CreatePlanData = {
  name: string;
  amount: number;
  description?: string | null;
};

/** Datos de la edición: todos opcionales, porque un PATCH puede tocar uno solo. */
type UpdatePlanData = {
  name?: string;
  amount?: number;
  description?: string | null;
};

// Las suscripciones viajan con cada plan porque las necesita la baja: borrar un
// plan que alguien está pagando dejaría suscripciones apuntando a la nada. La FK
// está en RESTRICT (ver entities/index.ts), así que la base lo rechazaría igual;
// traerlas es lo que permite responder un 409 con un mensaje entendible en vez de
// un error crudo de MySQL.
//
// Se piden solo dos columnas: el listado muestra los dos planes del sistema y
// traer las suscripciones enteras sería arrastrar todo el padrón sin usarlo.
const subscriptionsInclude = {
  model: Subscription,
  as: 'subscriptions',
  attributes: ['id_subscription', 'state'],
};

export const planRepository = {
  // Ordenados por monto: deja el Free primero y el Pro después, que es el orden
  // en el que la página de venta muestra las tarjetas.
  findAll: async (): Promise<PlanWithSubscriptions[]> => {
    const plans = await Plan.findAll({
      include: [subscriptionsInclude],
      order: [['amount', 'ASC']],
    });

    return plans as PlanWithSubscriptions[];
  },

  findById: async (id_plan: number): Promise<PlanWithSubscriptions | null> => {
    const plan = await Plan.findByPk(id_plan, {
      include: [subscriptionsInclude],
    });

    return plan as PlanWithSubscriptions | null;
  },

  // Busca un plan por su nombre exacto. Lo usa el checkout para resolver cuál es
  // el plan Pro sin tener su id hardcodeado en el código.
  findByName: async (name: string): Promise<PlanWithSubscriptions | null> => {
    const plan = await Plan.findOne({ where: { name } });
    return plan as PlanWithSubscriptions | null;
  },

  // Nombres de todos los planes, sin includes: es lo único que necesita la
  // comparación contra nombres repetidos. Son dos filas de dos columnas, así que
  // traerlas enteras sale más barato que una consulta por cada forma posible de
  // escribir el mismo nombre.
  findAllNames: (): Promise<PlanNameRow[]> =>
    Plan.findAll({
      attributes: ['id_plan', 'name'],
      order: [['name', 'ASC']],
    }),

  create: (data: CreatePlanData): Promise<Plan> =>
    Plan.create({
      name: data.name,
      amount: data.amount,
      description: data.description ?? null,
    }),

  update: async (
    plan: PlanWithSubscriptions,
    data: UpdatePlanData
  ): Promise<PlanWithSubscriptions> => {
    // update() devuelve la misma instancia, así que conserva lo que ya había
    // traído el include.
    await plan.update(data);
    return plan;
  },

  delete: (plan: PlanWithSubscriptions): Promise<void> => plan.destroy(),
};
