// Lo que dibuja una tarjeta del explorador de música, sea un álbum o una canción.
//
// Las secciones de /music muestran las dos cosas según la pestaña elegida, y las
// tarjetas son las mismas. En vez de que cada tarjeta sepa distinguir un Album de
// un Song, las features de álbum y de canción se traducen a esta vista mínima y
// las tarjetas trabajan siempre contra ella.
//
// Es solo de lectura y solo para el explorador: el modelo de verdad de cada
// entidad sigue viviendo en su feature.
import type { Album } from '../../album/models/Album';
import type { Song } from '../../song/models/Song';

export type ExploreItem = {
  id: number;
  /** A dónde lleva la tarjeta: la ficha del álbum o la de la canción. */
  to: string;
  title: string;
  artist: string;
  /** URL de la portada, o null si no tiene (la tarjeta dibuja una de reserva). */
  cover: string | null;
  /** Promedio de 0 a 5. 0 significa que todavía no lo reseñó nadie. */
  rating: number;
  reviewsCount: number;
  /** Año de lanzamiento, o null si no se conoce. */
  year: number | null;
};

/** Pasa un álbum a la vista que usan las tarjetas del explorador. */
export function albumToExploreItem(album: Album): ExploreItem {
  return {
    id: album.id,
    to: `/albums/${album.id}`,
    title: album.title,
    artist: album.artistName,
    cover: album.urlCover,
    rating: album.averageRating,
    reviewsCount: album.reviewsCount,
    year: album.releaseYear,
  };
}

/**
 * Pasa una canción a la vista que usan las tarjetas del explorador.
 *
 * La portada y el año son los del álbum: una canción no tiene ni una cosa ni la
 * otra propias (ver el DER).
 */
export function songToExploreItem(song: Song): ExploreItem {
  return {
    id: song.id,
    to: `/songs/${song.id}`,
    title: song.title,
    artist: song.artistName,
    cover: song.album?.urlCover ?? null,
    rating: song.averageRating,
    reviewsCount: song.reviewsCount,
    year: song.album?.releaseYear ?? null,
  };
}

/**
 * Cuántas reseñas tiene, en texto. Mientras no tenga ninguna se dice "Sin
 * reseñas" en vez de "0 reseñas", que se lee como un defecto del álbum y no como
 * lo que es: que la comunidad todavía no lo calificó.
 */
export function reviewsLabel(count: number): string {
  if (count === 0) return 'Sin reseñas';
  return count === 1 ? '1 reseña' : `${count.toLocaleString('es-AR')} reseñas`;
}
