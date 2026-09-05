// Versión reducida de una reseña, para las columnas de "más reseñas" del detalle.
//
// Es toda un enlace a la página de esa reseña: acá no se gestiona nada, solo se
// invita a seguir leyendo. Por eso no se reutiliza ReviewCard, que arrastra la
// botonera de editar, ocultar y eliminar y exige cinco handlers que en una
// columna lateral no tienen sentido.
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { StarRating } from './StarRating';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type ReviewSummaryCardProps = {
  review: Review;
};

export const ReviewSummaryCard = ({ review }: ReviewSummaryCardProps) => {
  return (
    <Link to={review.sharePath} className="review-summary">
      <div className="review-summary__head">
        <AlbumCover title={review.targetTitle} url={review.coverUrl} size="sm" />

        <div className="review-summary__target">
          <p className="review-summary__title">{review.targetTitle}</p>
          <p className="review-summary__subtitle">{review.targetSubtitle}</p>
        </div>
      </div>

      <StarRating value={review.rating} size={14} />

      {/* Una calificación sin texto es válida y es lo más común: se dice, en vez
          de dejar un hueco que parezca un error de carga. */}
      <p className="review-summary__text">
        {review.hasText ? review.excerpt : 'Calificó sin escribir una reseña.'}
      </p>

      <footer className="review-summary__footer">
        <span className="review-summary__author">{review.authorName}</span>

        <span className="review-summary__stats">
          <span className="review-summary__stat">
            <Heart size={13} aria-hidden="true" />
            {review.likesCount}
          </span>
          <span className="review-summary__stat">
            <MessageCircle size={13} aria-hidden="true" />
            {review.commentsCount}
          </span>
        </span>
      </footer>
    </Link>
  );
};
