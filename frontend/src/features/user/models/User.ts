// Modelo de un usuario dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/authService.ts).

/** Niveles de acceso del sistema, igual que el enum USERS.rol del backend. */
export const USER_ROLES = ['FREE', 'PRO', 'PATRON', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Forma cruda con la que viaja un usuario en las respuestas de la API.
 * Respeta los nombres del backend (snake_case y `rol`, como en el DER); pasarlo
 * al modelo es justamente lo que hace el servicio.
 */
export type UserApiResponse = {
  id_user: number;
  username: string;
  email: string;
  rol: UserRole;
  registration_date: string;
};

export class User {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly email: string,
    public readonly rol: UserRole,
    public readonly registrationDate: Date
  ) {}

  /** ¿Puede dar de alta artistas, álbumes y canciones? (circuito de aporte de catálogo) */
  get canContributeCatalog(): boolean {
    return this.rol === 'PATRON' || this.rol === 'ADMIN';
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
