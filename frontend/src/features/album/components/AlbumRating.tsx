// Calificación promedio con su estrella, tal como se muestra en la ficha del
// álbum y en cada pista del tracklist.
//
// Mientras nadie haya reseñado, el promedio es 0 y en ese caso se dice "Sin
// reseñas" en vez de mostrar "0 / 5", que parece un error. El número sale de
// average_rating, que va a llenar el CRUD de reseñas cuando exista.
import { Star } from 'lucide-react';
import '../styles/_album.scss';

type AlbumRatingProps = {
  /** Promedio de 0 a 5. 0 significa que todavía no lo reseñó nadie. */
  value: number;
  /** Cuántas reseñas hay detrás del promedio. */
  count: number;
  /** 'lg' para la cabecera de la ficha, 'sm' para las filas del tracklist. */
  size?: 'sm' | 'lg';
};

export const AlbumRating = ({ value, count, size = 'sm' }: AlbumRatingProps) => {
  if (value <= 0) {
    return <span className="album-rating-box album-rating-box--empty">Sin reseñas</span>;
  }

  return (
    <span className={`album-rating-box album-rating-box--${size}`}>
      <Star className="album-rating-box__star" size={size === 'lg' ? 20 : 15} aria-hidden="true" />
      <strong className="album-rating-box__value">{value.toFixed(1)}</strong>
      <span className="album-rating-box__max">/ 5</span>
      {size === 'lg' && (
        <span className="album-rating-box__count">
          ({count === 1 ? '1 reseña' : `${count} reseñas`})
        </span>
      )}
    </span>
  );
};
