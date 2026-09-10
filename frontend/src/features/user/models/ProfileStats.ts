// Contadores que se muestran en la cabecera de un perfil.
//
// Salen de dos endpoints distintos: los dos primeros de las estadísticas de
// reseñas (GET /api/reviews/stats) y los dos últimos de los contadores de
// seguimiento (GET /api/users/:id/follow-stats). Este tipo los junta en una sola
// forma para que la cabecera dibuje las cuatro cajas igual, sin saber de dónde
// vino cada número; quien arma el objeto es UserProfilePage.

export type ProfileStats = {
  /** Reseñas publicadas por el usuario (tabla REVIEW). */
  reviews: number;
  /**
   * Ítems escuchados. Se deriva de las reseñas: si un usuario reseñó un álbum o
   * una canción, es porque los escuchó. No hay tabla propia para esto.
   */
  listened: number;
  /** Usuarios a los que sigue (tabla FOLLOWS). */
  following: number;
  /** Usuarios que lo siguen (tabla FOLLOWS). */
  followers: number;
};

/** Contadores en cero: es el estado mientras las respuestas no llegaron. */
export const EMPTY_PROFILE_STATS: ProfileStats = {
  reviews: 0,
  listened: 0,
  following: 0,
  followers: 0,
};
