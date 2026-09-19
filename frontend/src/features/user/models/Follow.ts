// Modelos del seguimiento entre usuarios dentro del frontend: el estado del
// seguimiento sobre un usuario y la tarjeta de un usuario de la comunidad (la que
// se muestra en las sugerencias, la búsqueda y las listas de seguidores).
//
// El resto de la app trabaja SIEMPRE con estas clases; el JSON crudo del backend
// no sale nunca de la capa de servicios (ver services/followService.ts).
import type { UserRole } from './User';

/** Forma cruda del estado del seguimiento, tal como viaja en la API. */
export type FollowStatsApiResponse = {
  id_user: number;
  followers: number;
  following: number;
  followed_by_me: boolean;
};

/**
 * Forma cruda de la tarjeta de un usuario. La devuelven las sugerencias, el
 * ranking, la búsqueda y las listas de seguidores y seguidos.
 */
export type CommunityUserApiResponse = {
  id_user: number;
  username: string;
  url_avatar: string | null;
  rol: UserRole;
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

/**
 * Un usuario de la comunidad, tal como se lo lista: en el panel "Gente para
 * seguir", en los resultados del buscador y en las listas de seguidores y seguidos.
 */
export class CommunityUser {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly avatarUrl: string | null,
    public readonly rol: UserRole,
    /** Reseñas publicadas. Es el criterio por el que se recomienda a alguien. */
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

  /** Cuántos lo siguen, en singular o plural. */
  get followersLabel(): string {
    return this.followersCount === 1 ? '1 seguidor' : `${this.followersCount} seguidores`;
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
  withFollowedByMe(followedByMe: boolean): CommunityUser {
    return new CommunityUser(
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
