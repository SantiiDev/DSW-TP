// Modelos del seguimiento entre usuarios dentro del frontend: el estado del
// seguimiento sobre un usuario y el usuario que se recomienda seguir.
//
// El resto de la app trabaja SIEMPRE con estas clases; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/followService.ts).

/** Forma cruda del estado del seguimiento, tal como viaja en la API. */
export type FollowStatsApiResponse = {
  id_user: number;
  followers: number;
  following: number;
  followed_by_me: boolean;
};

/** Forma cruda de un usuario sugerido. */
export type SuggestedUserApiResponse = {
  id_user: number;
  username: string;
  url_avatar: string | null;
  rol: string;
  reviews_count: number;
  followers_count: number;
  followed_by_me: boolean;
};

/**
 * Estado del seguimiento sobre un usuario: sus dos contadores y si el que mira lo
 * sigue.
 *
 * Es lo que llena las cajas "Seguidores" y "Siguiendo" de la cabecera del perfil
 * y lo que decide qué dice el botón.
 */
export class FollowStats {
  constructor(
    public readonly userId: number,
    public readonly followers: number,
    public readonly following: number,
    public readonly followedByMe: boolean
  ) {}
}

/** Contadores en cero, para mostrar mientras la respuesta no llegó. */
export const EMPTY_FOLLOW_STATS = new FollowStats(0, 0, 0, false);

/** Un usuario que el panel "Gente para seguir" recomienda. */
export class SuggestedUser {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly avatarUrl: string | null,
    public readonly rol: string,
    /** Reseñas publicadas. Es el criterio por el que se lo recomienda. */
    public readonly reviewsCount: number,
    public readonly followersCount: number,
    public readonly followedByMe: boolean
  ) {}

  /** A dónde lleva la tarjeta al hacerle click. */
  get profilePath(): string {
    return `/users/${this.id}`;
  }

  /** Cuántas reseñas tiene, en singular o plural. */
  get reviewsLabel(): string {
    return this.reviewsCount === 1 ? '1 reseña' : `${this.reviewsCount} reseñas`;
  }

  /**
   * Copia de este usuario con el seguimiento cambiado.
   *
   * Se usa para que la tarjeta se actualice sin volver a pedir toda la lista: si
   * se recargara, el usuario que se acaba de seguir desaparecería de golpe del
   * panel (la API ya no lo sugiere) y el botón que se apretó se iría de la
   * pantalla antes de que se vea que hizo algo.
   *
   * @param followedByMe si pasa a estar seguido.
   */
  withFollowedByMe(followedByMe: boolean): SuggestedUser {
    return new SuggestedUser(
      this.id,
      this.username,
      this.avatarUrl,
      this.rol,
      this.reviewsCount,
      followedByMe ? this.followersCount + 1 : this.followersCount - 1,
      followedByMe
    );
  }
}
