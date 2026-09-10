// Servicio del seguimiento entre usuarios: centraliza las llamadas HTTP a
// /api/users/:id/follow, /api/users/:id/follow-stats y /api/users/suggestions, y
// mapea las respuestas crudas a los modelos de models/Follow.
//
// Va aparte de userService y no adentro porque es otra feature del backend
// (features/follow), y así los dos archivos siguen siendo el reflejo de un router.
import { httpClient } from '../../../core/services/httpClient';
import { FollowStats, SuggestedUser } from '../models/Follow';
import type { FollowStatsApiResponse, SuggestedUserApiResponse } from '../models/Follow';

/** Pasa el estado del seguimiento del JSON de la API al modelo. */
function toFollowStats(data: FollowStatsApiResponse): FollowStats {
  return new FollowStats(data.id_user, data.followers, data.following, data.followed_by_me);
}

/** Pasa un usuario sugerido del JSON de la API al modelo. */
function toSuggestedUser(data: SuggestedUserApiResponse): SuggestedUser {
  return new SuggestedUser(
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
   * A quiénes se recomienda seguir, del que más reseñas publicó al que menos.
   * Es una lectura pública: sin sesión devuelve gente igual, con el botón apagado.
   *
   * @param limit cuántos traer; sin él, los que devuelva la API por defecto.
   */
  async suggestions(limit?: number): Promise<SuggestedUser[]> {
    const query = limit !== undefined ? `?limit=${limit}` : '';
    const data = await httpClient.get<SuggestedUserApiResponse[]>(`/users/suggestions${query}`);
    return data.map(toSuggestedUser);
  },
};
