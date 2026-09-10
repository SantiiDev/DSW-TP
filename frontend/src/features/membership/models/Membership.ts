// Modelos de la membresía dentro del frontend: el plan, la suscripción y el pago.
// El resto de la app trabaja SIEMPRE con estas clases; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/membershipService.ts).

/** Estado de una suscripción, igual que el enum SUBSCRIPTION.state del backend. */
export const SUBSCRIPTION_STATES = ['active', 'expired', 'cancelled'] as const;
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

/** Etiqueta de cada estado: en la UI nunca se escribe el valor crudo. */
export const SUBSCRIPTION_STATE_LABELS: Record<SubscriptionState, string> = {
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

/** Nombre del plan pago. Lo usa la página de venta para destacar su tarjeta. */
export const PRO_PLAN_NAME = 'Pro';

/**
 * Cuántos días antes del vencimiento se le avisa al usuario que su membresía está
 * por terminar. Una semana da tiempo de renovar sin que el aviso viva en pantalla
 * todo el mes.
 */
export const RENEWAL_NOTICE_DAYS = 7;

/**
 * Cuántos meses cubre una membresía paga. Tiene que coincidir con
 * MEMBERSHIP_MONTHS de subscription.service.ts en el backend, que es quien
 * realmente calcula el vencimiento al activar.
 *
 * Acá se duplica solo para poder MOSTRAR el período antes de pagar: el resumen
 * de la contratación necesita decir hasta cuándo va a valer. El dato que queda
 * guardado es siempre el que calcula el backend.
 */
export const MEMBERSHIP_MONTHS = 1;

/**
 * Hasta cuándo valdría una membresía que se contrata en esta fecha.
 * @param from cuándo arranca; por defecto, ahora.
 */
export function calculateCoverageEnd(from: Date = new Date()): Date {
  const end = new Date(from);
  // setMonth resuelve solo los meses de distinto largo: contratar un 31 de enero
  // cubre hasta el 28 (o 29) de febrero, no hasta el 3 de marzo.
  end.setMonth(end.getMonth() + MEMBERSHIP_MONTHS);
  return end;
}

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
  subscription_date: string;
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
    public readonly startDate: Date,
    public readonly endDate: Date | null,
    public readonly state: SubscriptionState
  ) {}

  /** Etiqueta del estado, para la pastilla que se muestra al lado. */
  get stateLabel(): string {
    return SUBSCRIPTION_STATE_LABELS[this.state];
  }

  /**
   * Cuántos días le quedan de vigencia.
   *
   * Devuelve 0 si ya venció y null si la membresía no vence (el plan Free). Se
   * redondea para arriba para que el último día muestre "1 día" y no "0".
   */
  get daysLeft(): number | null {
    if (!this.endDate) return null;
    const ms = this.endDate.getTime() - Date.now();
    return ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * ¿Conviene ofrecerle renovar?
   *
   * La membresía es mensual con renovación manual: no se cobra sola, así que
   * avisar antes de que venza es lo que evita que el usuario pierda el acceso sin
   * enterarse.
   */
  get isExpiringSoon(): boolean {
    const days = this.daysLeft;
    return days !== null && days <= RENEWAL_NOTICE_DAYS;
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
