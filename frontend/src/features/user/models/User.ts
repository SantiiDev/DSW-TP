// Modelo de un usuario dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/authService.ts).
import type { BadgeTone } from '../../../core/components/Badge';

/** Niveles de acceso del sistema, igual que el enum USERS.rol del backend. */
export const USER_ROLES = ['FREE', 'PRO', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Nombre para mostrar de cada rol: en la UI nunca se escribe el valor crudo. */
export const ROLE_LABELS: Record<UserRole, string> = {
  FREE: 'Member',
  PRO: 'Pro',
  ADMIN: 'Admin',
};

/**
 * Color de la pastilla de cada rol (ver core/components/Badge). Va acá, al lado
 * de las etiquetas, para que el rol se pinte igual en el perfil y en el panel.
 */
export const ROLE_TONES: Record<UserRole, BadgeTone> = {
  FREE: 'neutral',
  PRO: 'success',
  ADMIN: 'info',
};

/**
 * Estado de una cuenta, igual que el enum USERS.state del backend.
 * La baja de un usuario es lógica: la cuenta pasa a 'suspended' y deja de poder
 * iniciar sesión, pero no se borra y un admin puede reactivarla.
 */
export const USER_STATES = ['active', 'suspended'] as const;
export type UserState = (typeof USER_STATES)[number];

export const STATE_LABELS: Record<UserState, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
};

/**
 * Forma cruda con la que viaja un usuario en las respuestas de la API.
 * Respeta los nombres del backend (snake_case y `rol`, como en el DER); pasarlo
 * al modelo es justamente lo que hace el servicio.
 */
export type UserApiResponse = {
  id_user: number;
  username: string;
  /** Solo viene si el que pide es el dueño de la cuenta o un ADMIN. */
  email?: string;
  rol: UserRole;
  state: UserState;
  url_avatar: string | null;
  registration_date: string;
};

export class User {
  constructor(
    public readonly id: number,
    public readonly username: string,
    /** Vacío cuando se mira el perfil de otro usuario: la API no lo expone. */
    public readonly email: string,
    public readonly rol: UserRole,
    /** 'active' o 'suspended'. Una cuenta suspendida no puede iniciar sesión. */
    public readonly state: UserState,
    /** URL de la foto de perfil, o null si usa el avatar por defecto. */
    public readonly urlAvatar: string | null,
    public readonly registrationDate: Date
  ) {}

  /** ¿La cuenta está habilitada? (o sea, no fue dada de baja) */
  get isActive(): boolean {
    return this.state === 'active';
  }

  /** Texto del estado para mostrar en la UI. */
  get stateLabel(): string {
    return STATE_LABELS[this.state];
  }

  /** ¿Puede dar de alta artistas, álbumes y canciones? (circuito de aporte de catálogo) */
  get canContributeCatalog(): boolean {
    return this.rol === 'PRO' || this.rol === 'ADMIN';
  }

  /** ¿Tiene la membresía paga? Decide qué versión de la página /pro se muestra. */
  get isPro(): boolean {
    return this.rol === 'PRO' || this.rol === 'ADMIN';
  }

  /** ¿Puede moderar contenido y gestionar planes? */
  get isAdmin(): boolean {
    return this.rol === 'ADMIN';
  }

  /**
   * ¿Tiene alguno de los roles pedidos? Lo usa ProtectedRoute para decidir si
   * deja entrar a una ruta.
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.rol);
  }
}
