// Modelos de la membresía dentro del frontend: el plan, la suscripción y el pago.
// El resto de la app trabaja SIEMPRE con estas clases; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/membershipService.ts).

/** Estado de una suscripción, igual que el enum SUBSCRIPTION.state del backend. */
export const SUBSCRIPTION_STATES = ['active', 'cancelled'] as const;
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

/** Etiqueta de cada estado: en la UI nunca se escribe el valor crudo. */
export const SUBSCRIPTION_STATE_LABELS: Record<SubscriptionState, string> = {
  active: 'Activa',
  cancelled: 'Cancelada',
};

/** Nombre del plan pago. Lo usa la página de venta para destacar su tarjeta. */
export const PRO_PLAN_NAME = 'Pro';

export type PlanApiResponse = {
  id_plan: number;
  name: string;
  amount: number;
  description: string | null;
  subscribers: number;
};

export type SubscriptionPlanApiResponse = {
  id_plan: number;
  name: string;
  amount: number;
};

export type SubscriptionApiResponse = {
  id_subscription: number;
  plan: SubscriptionPlanApiResponse | null;
  /**
   * null solo en la suscripción "genérica" que arma el backend para un PRO
   * asignado a mano por un admin, sin pago real detrás (ver subscription.service.ts).
   */
  subscription_date: string | null;
  end_date: string | null;
  state: SubscriptionState;
};

export type MembershipApiResponse = {
  current: SubscriptionApiResponse | null;
  history: SubscriptionApiResponse[];
};

export type PaymentApiResponse = {
  id_transaction: number;
  amount: number;
  payment_date: string;
  state: string;
  plan: string | null;
};

/** Lo que devuelve el arranque del checkout. */
export type CheckoutApiResponse = {
  checkoutUrl: string;
  preferenceId: string;
};

/** Lo que devuelve confirmar un pago al volver de MercadoPago. */
export type ConfirmApiResponse = {
  applied: boolean;
  status: string;
  message: string;
};

/** Un plan de membresía del sistema. */
export class Plan {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly amount: number,
    public readonly description: string | null,
    public readonly subscribers: number
  ) {}

  /** ¿Es el plan pago? Lo usa la página de venta para saber cuál ofrecer. */
  get isPaid(): boolean {
    return this.amount > 0;
  }

  /**
   * Precio listo para mostrar: "$ 3.500", "$ 1.750,50" o "Gratis".
   *
   * Los centavos se muestran solo si el precio los tiene. Un plan de $3.500 con
   * ",00" pegado atrás es ruido en la página de venta, pero redondear uno de
   * $1.750,50 a "$ 1.751" sería mostrar un precio que no es el que se va a
   * cobrar: la columna es un DECIMAL(10,2) y el panel de administración deja
   * cargar centavos.
   */
  get priceLabel(): string {
    if (!this.isPaid) return 'Gratis';

    const decimals = Number.isInteger(this.amount) ? 0 : 2;

    return this.amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /** Cuántos suscriptores tiene, en singular o plural, para la tabla del panel. */
  get subscribersLabel(): string {
    return this.subscribers === 1 ? '1 suscripción' : `${this.subscribers} suscripciones`;
  }

  /**
   * ¿Se puede eliminar?
   *
   * La API rechaza la baja con un 409 mientras el plan tenga suscripciones,
   * incluso vencidas o canceladas: son el historial de facturación del usuario y
   * de ellas cuelgan los pagos. Saberlo de antemano es lo que le permite al panel
   * explicar el motivo en vez de mostrar el error después de intentarlo.
   */
  get canBeDeleted(): boolean {
    return this.subscribers === 0;
  }
}

/** La suscripción de un usuario a un plan, con su vigencia. */
export class Subscription {
  constructor(
    public readonly id: number,
    public readonly planId: number | null,
    public readonly planName: string | null,
    public readonly amount: number,
    /** null en la genérica de un PRO asignado a mano: no hay fecha de alta real. */
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly state: SubscriptionState
  ) {}

  /** Etiqueta del estado, para la pastilla que se muestra al lado. */
  get stateLabel(): string {
    return SUBSCRIPTION_STATE_LABELS[this.state];
  }

  /**
   * ¿Es una suscripción real, con una fila propia en la base? False en la
   * genérica que arma el backend para un PRO asignado a mano por un admin, que
   * no tiene fecha de alta porque no hubo pago detrás.
   */
  get hasRealSubscription(): boolean {
    return this.startDate !== null;
  }
}

/** Un pago registrado del usuario. */
export class Payment {
  constructor(
    public readonly id: number,
    public readonly amount: number,
    public readonly date: Date,
    public readonly state: string,
    public readonly planName: string | null
  ) {}

  /** Importe listo para mostrar. */
  get amountLabel(): string {
    return this.amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }
}
