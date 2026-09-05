// Un ítem que un usuario calificó: la portada, qué es y la nota que le puso.
//
// Se arma a partir de la reseña y no del álbum o de la canción, porque lo que
// distingue a esta grilla de un listado de catálogo es justamente la nota propia.
// Por lo mismo no se reutilizan AlbumCard ni SongCard: esas piden los modelos
// completos de sus features, y dentro de una reseña viaja la referencia reducida.
import { Link } from 'react-router-dom';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { StarRating } from './StarRating';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type RatedItemCardProps = {
  /** La reseña de la que salen el ítem y la calificación. */
  review: Review;
};

export const RatedItemCard = ({ review }: RatedItemCardProps) => {
  return (
    // Lleva a la ficha del ítem, no a la reseña: acá se está mirando qué escuchó
    // esta persona, y de ahí se sigue hacia el álbum o la canción.
    <Link to={review.targetLink} className="rated-item">
      <AlbumCover title={review.targetTitle} url={review.coverUrl} size="lg" />

      <div className="rated-item__body">
        <h4 className="rated-item__title">{review.targetTitle}</h4>
        <p className="rated-item__subtitle">{review.targetSubtitle}</p>
        <StarRating value={review.rating} size={14} showValue />
      </div>
    </Link>
  );
};
