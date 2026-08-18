// Contadores que se muestran en la cabecera de un perfil.
//
// Hoy vienen en cero: las features que los alimentan todavía no están hechas
// (reseñas es el CRUD de Siena, y el seguimiento entre usuarios es una tabla que
// se suma más adelante). El tipo existe para que, cuando esos endpoints estén,
// solo haya que llenarlo sin tocar los componentes que lo consumen.

export type ProfileStats = {
  /** Reseñas publicadas por el usuario (tabla REVIEW). */
  reviews: number;
  /**
   * Ítems escuchados. Se deriva de las reseñas: si un usuario reseñó un álbum o
   * una canción, es porque los escuchó. No hay tabla propia para esto.
   */
  listened: number;
  /** Usuarios a los que sigue (pendiente de la tabla FOLLOW). */
  following: number;
  /** Usuarios que lo siguen (pendiente de la tabla FOLLOW). */
  followers: number;
};

/** Contadores en cero, mientras no haya endpoints que los calculen. */
export const EMPTY_PROFILE_STATS: ProfileStats = {
  reviews: 0,
  listened: 0,
  following: 0,
  followers: 0,
};
