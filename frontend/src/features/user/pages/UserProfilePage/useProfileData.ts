// Datos que necesita la página de perfil: el usuario (si es otro), las
// estadísticas de sus reseñas y los contadores de seguimiento.
//
// Vive en la carpeta de UserProfilePage porque es solo suyo: separa "qué se pide
// a la API y cuándo" de "cómo se dibuja", que es lo que queda en la página.
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { reviewService } from '../../../review/services/reviewService';
import type { ReviewStats } from '../../../review/models/Review';
import { EMPTY_PROFILE_STATS } from '../../models/ProfileStats';
import type { ProfileStats } from '../../models/ProfileStats';
import type { FollowStats } from '../../models/Follow';
import type { User } from '../../models/User';
import { followService } from '../../services/followService';
import { userService } from '../../services/userService';

/**
 * @param profileId id del perfil que se mira, o undefined si todavía no se sabe.
 * @param isOwnProfile si es el del usuario logueado: ese no se pide, ya está en el contexto.
 */
export function useProfileData(profileId: number | undefined, isOwnProfile: boolean) {
  // Perfil de OTRO usuario, pedido a la API. El propio no se pide.
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estadísticas de las reseñas del perfil. Se piden UNA vez acá y se reparten:
  // la cabecera las usa para sus contadores y la columna lateral para el
  // histograma de calificaciones. null mientras no llegaron.
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  // Seguidores, seguidos y si el que mira sigue a este perfil. Se piden aparte de
  // las de reseñas porque salen de otra tabla y de otro endpoint. null mientras
  // no llegaron.
  const [followStats, setFollowStats] = useState<FollowStats | null>(null);

  const loadUser = useCallback(async (userId: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setFetchedUser(await userService.getById(userId));
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setFetchedUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // El perfil propio ya está en el contexto: pedirlo de nuevo sería una request
    // de más y encima haría parpadear la pantalla después de cada edición.
    if (profileId === undefined || isOwnProfile) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser(profileId);
  }, [profileId, isOwnProfile, loadUser]);

  // Se declara con useCallback porque también se llama a mano cuando el usuario
  // borra una reseña desde la pestaña "Reseñas".
  const loadReviewStats = useCallback(async () => {
    if (profileId === undefined) return;

    try {
      setReviewStats(await reviewService.stats(profileId));
    } catch {
      // Que fallen las estadísticas no puede tirar abajo el perfil entero: se
      // dejan en null y los contadores y el histograma quedan en cero.
      setReviewStats(null);
    }
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReviewStats();
  }, [loadReviewStats]);

  // Se llama también a mano al seguir o dejar de seguir desde la lista de seguidores.
  const loadFollowStats = useCallback(async () => {
    if (profileId === undefined) return;

    try {
      setFollowStats(await followService.stats(profileId));
    } catch {
      // Mismo criterio que con las estadísticas de reseñas: que fallen los
      // contadores no puede tirar abajo el perfil entero.
      setFollowStats(null);
    }
  }, [profileId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFollowStats();
  }, [loadFollowStats]);

  // Las tres cajas de la cabecera salen de dos endpoints distintos: una de las
  // estadísticas de reseñas y dos de los contadores de seguimiento. Cada parte
  // queda en cero mientras su respuesta no llegó, sin bloquear a la otra.
  const headerStats: ProfileStats = {
    ...EMPTY_PROFILE_STATS,
    ...(reviewStats === null ? {} : { reviews: reviewStats.total }),
    ...(followStats === null
      ? {}
      : { following: followStats.following, followers: followStats.followers }),
  };

  return {
    fetchedUser,
    isLoading,
    loadError,
    setLoadError,
    reviewStats,
    loadReviewStats,
    followStats,
    setFollowStats,
    loadFollowStats,
    headerStats,
  };
}
