// Servicio del seguimiento entre usuarios: centraliza las llamadas HTTP a
// /api/users/:id/follow, /follow-stats, /followers, /following, /api/users/search
// y /api/users/suggestions, y mapea las respuestas crudas a los modelos de
// models/Follow.
//
// Va aparte de userService y no adentro porque es otra feature del backend
// (features/follow), y así los dos archivos siguen siendo el reflejo de un router.
import { httpClient } from '../../../core/services/httpClient';
import { CommunityUser, FollowStats } from '../models/Follow';
import type { CommunityUserApiResponse, FollowStatsApiResponse } from '../models/Follow';

/** Paginado de las listas de seguidores y seguidos. */
export type FollowListPage = {
  limit: number;
  offset: number;
};

/** Pasa el estado del seguimiento del JSON de la API al modelo. */
function toFollowStats(data: FollowStatsApiResponse): FollowStats {
  return new FollowStats(data.id_user, data.followers, data.following, data.followed_by_me);
}

/** Pasa la tarjeta de un usuario del JSON de la API al modelo. */
function toCommunityUser(data: CommunityUserApiResponse): CommunityUser {
  return new CommunityUser(
    data.id_user,
    data.username,
    data.url_avatar,
    data.rol,
    data.reviews_count,
    data.followers_count,
    data.followed_by_me
  );
}

export const followService = {
  /**
   * Contadores de un usuario y si el que pregunta lo sigue.
   * Es una lectura pública: no hace falta sesión.
   *
   * @param userId usuario del que se piden los contadores.
   */
  async stats(userId: number): Promise<FollowStats> {
    const data = await httpClient.get<FollowStatsApiResponse>(`/users/${userId}/follow-stats`);
    return toFollowStats(data);
  },

  /**
   * Empieza a seguir a un usuario.
   * @returns el estado ya actualizado, para no tener que pedirlo aparte.
   */
  async follow(userId: number): Promise<FollowStats> {
    const data = await httpClient.post<FollowStatsApiResponse>(`/users/${userId}/follow`);
    return toFollowStats(data);
  },

  /**
   * Deja de seguir a un usuario.
   *
   * El DELETE responde 204 sin cuerpo, así que después se piden los contadores.
   * Son dos requests, pero deja a follow() y unfollow() devolviendo lo mismo: el
   * que llama no tiene que mantener dos caminos distintos según la operación.
   */
  async unfollow(userId: number): Promise<FollowStats> {
    await httpClient.delete<null>(`/users/${userId}/follow`);
    return this.stats(userId);
  },

  /**
   * Quiénes siguen a un usuario, del seguimiento más reciente al más viejo.
   * @param userId dueño del perfil.
   * @param page tanda a pedir.
   */
  async followers(userId: number, { limit, offset }: FollowListPage): Promise<CommunityUser[]> {
    const data = await httpClient.get<CommunityUserApiResponse[]>(
      `/users/${userId}/followers?limit=${limit}&offset=${offset}`
    );
    return data.map(toCommunityUser);
  },

  /**
   * A quiénes sigue un usuario, del seguimiento más reciente al más viejo.
   * @param userId dueño del perfil.
   * @param page tanda a pedir.
   */
  async following(userId: number, { limit, offset }: FollowListPage): Promise<CommunityUser[]> {
    const data = await httpClient.get<CommunityUserApiResponse[]>(
      `/users/${userId}/following?limit=${limit}&offset=${offset}`
    );
    return data.map(toCommunityUser);
  },

  /**
   * Busca usuarios por nombre: primero los que empiezan con el texto.
   * @param text lo que escribió el usuario en el buscador.
   * @param limit cuántos traer; sin él, los que devuelva la API por defecto.
   */
  async search(text: string, limit?: number): Promise<CommunityUser[]> {
    const params = new URLSearchParams({ q: text });
    if (limit !== undefined) params.set('limit', String(limit));

    const data = await httpClient.get<CommunityUserApiResponse[]>(`/users/search?${params}`);
    return data.map(toCommunityUser);
  },

  /**
   * A quiénes se recomienda seguir, del que más reseñas publicó al que menos.
   * Es una lectura pública: sin sesión devuelve gente igual, con el botón apagado.
   *
   * @param limit cuántos traer; sin él, los que devuelva la API por defecto.
   */
  async suggestions(limit?: number): Promise<CommunityUser[]> {
    const query = limit !== undefined ? `?limit=${limit}` : '';
    const data = await httpClient.get<CommunityUserApiResponse[]>(`/users/suggestions${query}`);
    return data.map(toCommunityUser);
  },
};
