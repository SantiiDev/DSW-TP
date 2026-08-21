// Enumerados compartidos por varias entidades del dominio.

/** Niveles de acceso del sistema (USERS.rol). */
export const USER_ROLES = ['FREE', 'PRO', 'PATRON', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Estado de moderación del contenido de catálogo (ARTIST, ALBUMS, SONG).
 * Lo cargado por el seed queda en 'approved'; lo que da de alta un usuario PATRON
 * entra como 'pending' hasta que un ADMIN lo revisa.
 */
export const CONTENT_STATES = ['pending', 'approved', 'rejected'] as const;
export type ContentState = (typeof CONTENT_STATES)[number];

/** Estado de una reseña (REVIEW.state). */
export const REVIEW_STATES = ['published', 'hidden', 'deleted'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

/**
 * Estado de una suscripción (SUBSCRIPTION.state).
 * - active:    es la membresía vigente del usuario.
 * - expired:   se cumplió su end_date sin renovarse.
 * - cancelled: el usuario la dio de baja antes de su vencimiento.
 */
export const SUBSCRIPTION_STATES = ['active', 'expired', 'cancelled'] as const;
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

/** Estado de un pago (PAYMENTS.state), alineado con los estados de la pasarela. */
export const PAYMENT_STATES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];
