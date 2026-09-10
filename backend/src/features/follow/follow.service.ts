// Lógica de negocio del seguimiento entre usuarios: seguir, dejar de seguir,
// contadores y sugerencias de a quién seguir. No conoce req ni res; recibe datos
// ya validados y lanza errores de negocio que traduce el errorHandler.
//
// Es la feature que alimenta el feed social: review.service le pide acá la lista
// de ids que sigue el usuario para armar el feed de amigos.
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
import { UserRole } from '../../shared/types/enums';
import { User } from '../../entities';
import { followRepository, SuggestedUserRow } from './follow.repository';
import { SuggestedUsersQuery } from './follow.schema';

/**
 * Estado del seguimiento sobre un usuario, tal como sale en la API.
 *
 * Es la respuesta de las tres operaciones (seguir, dejar de seguir y consultar),
 * para que el frontend actualice el perfil y el panel sin pedir nada más y sin
 * tener que armar el número a mano.
 */
export type PublicFollowStats = {
  id_user: number;
  /** Cuántos lo siguen. */
  followers: number;
  /** A cuántos sigue. */
  following: number;
  /** Si el que hace la request lo sigue. Siempre false sin sesión. */
  followed_by_me: boolean;
};

/**
 * Un usuario recomendado, reducido a lo que dibuja la tarjeta del panel.
 *
 * NO lleva email ni state: es una lista pública de descubrimiento, y el email es
 * un dato privado que solo ve su dueño o un ADMIN (ver user.service).
 */
export type PublicSuggestedUser = {
  id_user: number;
  username: string;
  url_avatar: string | null;
  rol: UserRole;
  /** Cuántas reseñas publicó. Es lo que se muestra debajo del nombre. */
  reviews_count: number;
  followers_count: number;
  followed_by_me: boolean;
};

/**
 * Busca el usuario por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExistingUser(id_user: number): Promise<User> {
  const user = await followRepository.findUserById(id_user);
  if (!user) throw new NotFoundError('El usuario');
  return user;
}

/**
 * Corta con 400 si alguien intenta seguirse a sí mismo.
 *
 * Es un 400 y no un 409: no hay conflicto con un estado existente, la request no
 * tiene sentido de entrada.
 */
function assertNotSelf(id_follower: number, id_followed: number): void {
  if (id_follower === id_followed) {
    throw new BadRequestError('No podés seguirte a vos mismo.');
  }
}

/**
 * Corta con 400 si la cuenta está suspendida: su perfil no muestra contenido, y
 * seguirla dejaría en el feed a alguien que no puede publicar nada.
 */
function assertActive(user: User): void {
  if (user.state !== 'active') {
    throw new BadRequestError('Esa cuenta está suspendida y no se puede seguir.');
  }
}

/**
 * Arma el estado del seguimiento sobre un usuario.
 * @param id_user usuario del que se informa.
 * @param actorId quién pregunta, o null si no hay sesión.
 */
async function buildStats(id_user: number, actorId: number | null): Promise<PublicFollowStats> {
  const [followers, following] = await Promise.all([
    followRepository.countFollowers(id_user),
    followRepository.countFollowing(id_user),
  ]);

  // Sin sesión no hay a quién comparar: el corazón del botón va apagado y el
  // frontend abre el modal de registro al tocarlo.
  const link =
    actorId === null || actorId === id_user
      ? null
      : await followRepository.findOne(actorId, id_user);

  return {
    id_user,
    followers,
    following,
    followed_by_me: link !== null,
  };
}

/**
 * Pasa una fila de la consulta de sugerencias a la vista pública.
 *
 * Los dos conteos salen de subconsultas y MySQL los puede devolver como texto,
 * así que se fuerzan a número acá: si no, el frontend recibiría "3" en vez de 3 y
 * cualquier comparación numérica fallaría en silencio.
 *
 * @param row usuario con sus conteos.
 * @param followedIds ids que el que pregunta ya sigue.
 */
function toPublicSuggestedUser(row: SuggestedUserRow, followedIds: number[]): PublicSuggestedUser {
  return {
    id_user: row.id_user,
    username: row.username,
    url_avatar: row.url_avatar ?? null,
    rol: row.rol,
    reviews_count: Number(row.get('reviews_count')),
    followers_count: Number(row.get('followers_count')),
    followed_by_me: followedIds.includes(row.id_user),
  };
}

export const followService = {
  /**
   * Empieza a seguir a un usuario.
   *
   * @param id_followed a quién seguir.
   * @param actor quién sigue, sacado del token.
   * @returns el estado del seguimiento ya actualizado.
   */
  async follow(id_followed: number, actor: TokenPayload): Promise<PublicFollowStats> {
    assertNotSelf(actor.id_user, id_followed);

    const target = await findExistingUser(id_followed);
    assertActive(target);

    const existing = await followRepository.findOne(actor.id_user, id_followed);
    // 409 y no un 200 silencioso: seguir dos veces es un pedido contradictorio, y
    // avisarlo le permite al frontend darse cuenta de que su botón quedó
    // desincronizado en vez de creer que hizo algo.
    if (existing) throw new ConflictError('Ya seguís a esta persona.');

    await followRepository.create(actor.id_user, id_followed);

    return buildStats(id_followed, actor.id_user);
  },

  /**
   * Deja de seguir a un usuario.
   *
   * No es un toggle del endpoint de arriba a propósito: el "me gusta" sí lo es,
   * porque el corazón es un interruptor que se dibuja donde el dedo lo aprieta,
   * pero un doble click sobre "Seguir" no puede vaciarle el feed a alguien sin
   * que se entere. Con dos endpoints explícitos, repetir la operación devuelve
   * 409 o 404 y el frontend puede corregirse. Es el mismo criterio con el que
   * ocultar y restaurar una reseña son dos rutas y no una.
   *
   * @param id_followed a quién dejar de seguir.
   * @param actor quién deja de seguir.
   */
  async unfollow(id_followed: number, actor: TokenPayload): Promise<void> {
    await findExistingUser(id_followed);

    const existing = await followRepository.findOne(actor.id_user, id_followed);
    if (!existing) throw new NotFoundError('El seguimiento');

    await followRepository.delete(existing);
  },

  /**
   * Contadores de seguidores y seguidos de un usuario, más si el que pregunta lo
   * sigue. Es lo que llena las dos cajas de la cabecera del perfil.
   *
   * @param id_user usuario del que se piden los contadores.
   * @param actor quién pregunta, o null si no hay sesión.
   */
  async stats(id_user: number, actor: TokenPayload | null): Promise<PublicFollowStats> {
    await findExistingUser(id_user);
    return buildStats(id_user, actor?.id_user ?? null);
  },

  /**
   * Los ids de la gente que sigue un usuario.
   *
   * La consume review.service para armar el feed de amigos. Es una llamada
   * service -> service: la feature review no habla con la tabla follows, le
   * pregunta a la feature que es dueña de esa relación.
   *
   * @param id_user usuario que sigue.
   */
  listFollowedIds(id_user: number): Promise<number[]> {
    return followRepository.findFollowedIds(id_user);
  },

  /**
   * A quiénes se recomienda seguir.
   *
   * Se excluye al propio usuario y a los que ya sigue: ofrecerlos sería ocupar el
   * panel con tarjetas cuyo botón ya dice "Siguiendo". Sin sesión no se excluye a
   * nadie, porque es la vitrina para el visitante.
   *
   * No se excluye a los ADMIN: son usuarios más de la comunidad y, con la base
   * recién sembrada, suelen ser los únicos con reseñas publicadas.
   *
   * @param query cuántos traer.
   * @param actor quién pregunta, o null si no hay sesión.
   */
  async suggestions(
    query: SuggestedUsersQuery,
    actor: TokenPayload | null
  ): Promise<PublicSuggestedUser[]> {
    const followedIds = actor ? await followRepository.findFollowedIds(actor.id_user) : [];
    const excludeIds = actor ? [actor.id_user, ...followedIds] : [];

    const rows = await followRepository.findSuggestions({ limit: query.limit, excludeIds });

    // followedIds queda siempre vacío en la práctica cuando hay sesión, porque los
    // seguidos ya se excluyeron de la consulta. Se pasa igual para que el DTO sea
    // correcto por sí mismo y no dependa de esa exclusión.
    return rows.map((row) => toPublicSuggestedUser(row, followedIds));
  },
};
