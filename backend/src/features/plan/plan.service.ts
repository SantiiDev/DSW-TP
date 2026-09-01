// Lógica de negocio del CRUD de planes de membresía: alta, listado, edición y
// baja. No conoce req ni res; recibe datos ya validados y lanza errores de
// negocio que traduce el errorHandler.
//
// Igual que en genre.service.ts, acá no hay chequeos de "dueño o admin": un plan
// no lo aporta nadie, es la definición comercial del sistema. Toda la escritura
// es de ADMIN y eso ya lo corta requireRole en las rutas, así que el service se
// ocupa únicamente de las reglas del dominio.
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import {
  planRepository,
  PlanSubscription,
  PlanWithSubscriptions,
} from './plan.repository';
import { CreatePlanInput, UpdatePlanInput } from './plan.schema';

/**
 * Vista pública de un plan: es lo que sale en el listado, en la ficha, en el alta
 * y en la edición.
 *
 * `subscribers` es un conteo y no la lista de suscripciones: la página de venta
 * no lo usa, pero el panel de administración necesita saber cuánta gente depende
 * de un plan antes de intentar tocarlo. Devolver quiénes son sería filtrar el
 * padrón de usuarios en un endpoint público.
 */
type PublicPlan = {
  id_plan: number;
  name: string;
  amount: number;
  description: string | null;
  subscribers: number;
};

/**
 * Arma la vista pública de un plan.
 * @param plan plan de la base, con sus suscripciones si la consulta las trajo.
 */
function toPublicPlan(plan: PlanWithSubscriptions): PublicPlan {
  return {
    id_plan: plan.id_plan,
    name: plan.name,
    // El getter de la entidad ya lo devuelve como número: la columna es un
    // DECIMAL y sin él llegaría como string.
    amount: plan.amount,
    description: plan.description ?? null,
    // Un plan recién creado no pasó por el include, y de todas formas todavía no
    // puede tener suscriptores.
    subscribers: (plan.subscriptions ?? []).length,
  };
}

/**
 * Normaliza un nombre para poder compararlo: minúsculas, sin acentos y sin nada
 * que no sea una letra o un número. Es el mismo criterio que usa
 * genre.service.ts, así "Pro " y "pro" quedan iguales.
 */
function normalizeName(name: string): string {
  return (
    name
      .toLowerCase()
      // NFD separa cada letra acentuada en letra + acento aparte, y el filtro
      // siguiente borra ese acento suelto junto con los espacios y los signos.
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '')
  );
}

/**
 * Corta con 409 si ya existe otro plan con el mismo nombre. Además de ser
 * confuso en la página de venta, la columna tiene un índice único
 * (plan_name_unique), así que la base lo rechazaría igual: el chequeo está para
 * poder explicar el problema en vez de devolver un error de MySQL.
 *
 * @param name nombre a verificar, ya validado por Zod.
 * @param excludeId en una edición, el id del propio plan: que su nombre coincida
 *   consigo mismo no es un conflicto.
 */
async function assertNameAvailable(name: string, excludeId?: number): Promise<void> {
  const normalized = normalizeName(name);
  const plans = await planRepository.findAllNames();

  const duplicate = plans.find(
    (plan) => plan.id_plan !== excludeId && normalizeName(plan.name) === normalized
  );

  if (duplicate) {
    throw new ConflictError(`Ya existe un plan llamado "${duplicate.name}".`);
  }
}

/**
 * Busca el plan por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_plan: number): Promise<PlanWithSubscriptions> {
  const plan = await planRepository.findById(id_plan);
  if (!plan) throw new NotFoundError('El plan');
  return plan;
}

/**
 * Arma el mensaje que explica por qué no se puede borrar un plan.
 * @param name nombre del plan que se quiso borrar.
 * @param subscriptions suscripciones que lo apuntan.
 */
function buildDeleteConflictMessage(name: string, subscriptions: PlanSubscription[]): string {
  const total = subscriptions.length;
  const detail = total === 1 ? '1 suscripción' : `${total} suscripciones`;

  return (
    `No se puede eliminar el plan "${name}" porque tiene ${detail} asociadas. ` +
    `Se puede editar su precio o su descripción, pero no darlo de baja mientras ` +
    `haya usuarios con historial en él.`
  );
}

export const planService = {
  /**
   * Da de alta un plan. Solo ADMIN, que es lo que corta requireRole en la ruta.
   * @param data nombre, monto y descripción ya validados.
   */
  async create(data: CreatePlanInput): Promise<PublicPlan> {
    await assertNameAvailable(data.name);

    const plan = await planRepository.create({
      name: data.name,
      amount: data.amount,
      description: data.description ?? null,
    });

    return toPublicPlan(plan);
  },

  /**
   * Lista los planes de membresía del sistema, del más barato al más caro.
   *
   * No lleva filtros, a diferencia del listado de géneros: son dos planes y no un
   * catálogo, así que un buscador no tendría sentido.
   */
  async list(): Promise<PublicPlan[]> {
    const plans = await planRepository.findAll();
    return plans.map(toPublicPlan);
  },

  /** Ficha de un plan puntual. */
  async getById(id_plan: number): Promise<PublicPlan> {
    const plan = await findExisting(id_plan);
    return toPublicPlan(plan);
  },

  /**
   * Modifica un plan.
   *
   * Cambiar el monto NO afecta a las suscripciones ya cobradas: cada pago quedó
   * registrado en PAYMENTS con el importe que se cobró en ese momento (ver
   * payment.entity.ts). El monto del plan es el precio de la próxima
   * contratación, no el de las anteriores.
   *
   * @param id_plan plan a modificar.
   * @param data campos a cambiar, al menos uno.
   */
  async update(id_plan: number, data: UpdatePlanInput): Promise<PublicPlan> {
    const plan = await findExisting(id_plan);

    // Renombrar también puede generar un duplicado, así que se chequea igual que
    // en el alta. Solo si el nombre viene en la request: un PATCH que toca el
    // precio no tiene por qué pagar esa consulta.
    if (data.name !== undefined) {
      await assertNameAvailable(data.name, id_plan);
    }

    const updated = await planRepository.update(plan, data);
    return toPublicPlan(updated);
  },

  /**
   * Elimina un plan.
   *
   * Se rechaza con 409 mientras tenga suscripciones, incluso vencidas o
   * canceladas: esas filas son el historial de facturación del usuario y de ellas
   * cuelgan los pagos. La asociación ya está declarada en RESTRICT, así que la
   * base rechazaría el borrado igual; este chequeo es el que convierte ese error
   * de MySQL en un mensaje que se entiende.
   *
   * @param id_plan plan a eliminar.
   */
  async remove(id_plan: number): Promise<void> {
    const plan = await findExisting(id_plan);

    const subscriptions = plan.subscriptions ?? [];
    if (subscriptions.length > 0) {
      throw new ConflictError(buildDeleteConflictMessage(plan.name, subscriptions));
    }

    await planRepository.delete(plan);
  },
};
