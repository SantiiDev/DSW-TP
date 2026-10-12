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
 * Colores de acento que un PRO puede elegir para su perfil, igual que el enum
 * USERS.profile_color del backend. El tono exacto de cada uno lo define el mapa
 * $profile-accents de abstracts/_variable.scss: acá solo viaja el nombre.
 */
export const PROFILE_COLORS = ['green', 'blue', 'purple', 'pink', 'orange', 'gold'] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];

export const PROFILE_COLOR_LABELS: Record<ProfileColor, string> = {
  green: 'Verde',
  blue: 'Azul',
  purple: 'Violeta',
  pink: 'Rosa',
  orange: 'Naranja',
  gold: 'Dorado',
};

/** El color que rige cuando el usuario no eligió ninguno: el verde del sitio. */
export const DEFAULT_PROFILE_COLOR: ProfileColor = 'green';

/** Recorte del banner cuando el usuario no eligió ninguno: el centro de la imagen. */
export const DEFAULT_BANNER_POSITION = 50;

/**
 * Color de acento con el que se dibuja a un usuario en cualquier pantalla
 * (su ficha, la franja de sus reseñas, sus listas).
 *
 * Solo las cuentas Pro o Admin tienen acento: la personalización es un
 * beneficio de la membresía. Un FREE devuelve null aunque tenga un color
 * guardado de cuando era Pro, que se conserva por si vuelve a pagar.
 *
 * @param rol rol actual del usuario.
 * @param color color guardado, o null si nunca eligió uno.
 */
export function visibleAccent(rol: UserRole, color: ProfileColor | null): ProfileColor | null {
  if (rol === 'FREE') return null;
  return color ?? DEFAULT_PROFILE_COLOR;
}

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
  url_banner: string | null;
  banner_position: number;
  profile_color: ProfileColor | null;
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
    /**
     * Personalización Pro tal como está guardada. Puede tener valor aunque la
     * cuenta ya sea FREE: para dibujarla se usan visibleBanner y visibleColor.
     */
    public readonly urlBanner: string | null,
    /** Qué franja de la imagen se ve en el banner: 0 arriba, 100 abajo. */
    public readonly bannerPosition: number,
    public readonly profileColor: ProfileColor | null,
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

  /** ¿Puede elegir banner y color de perfil? Es un beneficio de la membresía. */
  get canCustomizeProfile(): boolean {
    return this.isPro;
  }

  /**
   * Banner que se dibuja en la ficha. Si la cuenta dejó de ser Pro el valor
   * sigue guardado, pero no se muestra: reaparece solo si vuelve a pagar.
   */
  get visibleBanner(): string | null {
    return this.canCustomizeProfile ? this.urlBanner : null;
  }

  /** Color de acento que rige en la ficha, con el mismo criterio que visibleBanner. */
  get visibleColor(): ProfileColor {
    return visibleAccent(this.rol, this.profileColor) ?? DEFAULT_PROFILE_COLOR;
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
