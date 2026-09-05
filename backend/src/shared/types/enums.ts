// Enumerados compartidos por varias entidades del dominio.

/** Niveles de acceso del sistema (USERS.rol). */
export const USER_ROLES = ['FREE', 'PRO', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Estado de una cuenta (USERS.state).
 *
 * La baja de un usuario es LÓGICA: la fila no se borra nunca, pasa a 'suspended'.
 * Si se borrara, se irían con ella sus reseñas y su historial de pagos, y las
 * FK que apuntan a users lo rechazarían igual. Una cuenta suspendida no puede
 * iniciar sesión, y un ADMIN puede reactivarla cuando quiera.
 */
export const USER_STATES = ['active', 'suspended'] as const;
export type UserState = (typeof USER_STATES)[number];

/**
 * Estado de moderación del contenido de catálogo (ARTIST, ALBUMS, SONG).
 * Lo cargado por el seed queda en 'approved'; lo que da de alta un usuario PRO
 * entra como 'pending' hasta que un ADMIN lo revisa.
 */
export const CONTENT_STATES = ['pending', 'approved', 'rejected'] as const;
export type ContentState = (typeof CONTENT_STATES)[number];

/** Estado de una reseña (REVIEW.state). */
export const REVIEW_STATES = ['published', 'hidden', 'deleted'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

/**
 * A qué tipo de ítem apunta una reseña. No es una columna: en la tabla eso se
 * guarda como cuál de los dos ids quedó cargado (id_album o id_song, nunca los
 * dos). Es la forma de pedir "todas las reseñas de álbum" sin decir de cuál.
 */
export const REVIEW_TARGETS = ['album', 'song'] as const;
export type ReviewTargetKind = (typeof REVIEW_TARGETS)[number];

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
