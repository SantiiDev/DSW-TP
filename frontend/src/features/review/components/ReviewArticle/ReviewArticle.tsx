// La reseña en sí, en su página: la firma (quién, cuánto le puso y cuándo) y el
// texto completo, sin cortar.
import { Link } from 'react-router-dom';
import { Avatar } from '../../../../core/components/Avatar';
import { Badge } from '../../../../core/components/Badge';
import { RoleBadge } from '../../../user/components/RoleBadge';
import { StarRating } from '../StarRating';
import type { Review } from '../../models/Review';
import './ReviewArticle.scss';

type ReviewArticleProps = {
  review: Review;
};

export const ReviewArticle = ({ review }: ReviewArticleProps) => {
  return (
    <article className="review-article">
      <header className="review-article__author">
        {/* El avatar y el nombre llevan al perfil de quien la escribió, salvo
            que la reseña haya quedado sin autor: ahí no hay perfil al que ir,
            así que van como texto suelto. */}
        {review.author ? (
          <Link to={`/users/${review.author.id}`} className="review-article__avatar">
            <Avatar url={review.author.avatarUrl} username={review.authorName} size="lg" />
          </Link>
        ) : (
          <span className="review-article__avatar">
            <Avatar url={null} username={review.authorName} size="lg" />
          </span>
        )}

        {/* La calificación va debajo del nombre y no al costado: es lo primero
            que se lee de una reseña, junto con quién la firma. */}
        <div className="review-article__author-meta">
          <p className="review-article__author-name">
            Reseña de{' '}
            {review.author ? (
              <Link to={`/users/${review.author.id}`}>{review.authorName}</Link>
            ) : (
              <strong>{review.authorName}</strong>
            )}
            <RoleBadge rol={review.authorRol} accent={review.authorAccent} />
            {/* La pastilla solo la ven el autor y un ADMIN: para el resto una
                reseña oculta devuelve 404. */}
            {review.isHidden && <Badge tone="warning">Oculta</Badge>}
          </p>

          <StarRating value={review.rating} size={24} />

          <p className="review-article__date">
            Publicada el {review.dateLabel}
            {review.isEdited && <span title={`Editada el ${review.editedLabel}`}> · Editado</span>}
          </p>
        </div>
      </header>

      {/* Acá el texto va entero: para eso se entra a la página. */}
      {review.hasText ? (
        <p className="review-article__text">{review.text}</p>
      ) : (
        <p className="review-article__text review-article__text--empty">
          {review.authorName} calificó sin escribir una reseña.
        </p>
      )}
    </article>
  );
};
