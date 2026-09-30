// Cabecera de la página de una reseña: el ítem reseñado (álbum o canción) con su
// portada difuminada de fondo.
//
// Es la respuesta a "¿de qué es esta reseña?", que es lo primero que se pregunta
// quien abre un enlace compartido. Con GatedLink, sin cuenta lleva al registro
// en vez de a una ruta privada.
import { GatedLink } from '../../../../core/components/GatedLink';
import { AlbumCover } from '../../../genre/components/AlbumCover';
import type { Review } from '../../models/Review';
import './ReviewDetailHero.scss';

type ReviewDetailHeroProps = {
  review: Review;
};

export const ReviewDetailHero = ({ review }: ReviewDetailHeroProps) => {
  return (
    <header className="review-hero">
      {/* La portada, repetida de fondo, difuminada y oscurecida. Es la única
          imagen que tenemos del ítem, y da el color del disco a la cabecera sin
          pedirle nada nuevo a la API. Decorativa: el mismo dato ya se ve en la
          carátula de al lado. */}
      {review.coverUrl && (
        <div
          className="review-hero__backdrop"
          style={{ backgroundImage: `url(${review.coverUrl})` }}
          aria-hidden="true"
        />
      )}

      <div className="review-hero__content">
        {/* La carátula va dentro de una caja de ancho fijo: el componente
            compartido dibuja su versión grande al 100% del contenedor, porque
            está pensado para una celda de grilla. */}
        <GatedLink to={review.targetLink} className="review-hero__cover">
          <AlbumCover title={review.targetTitle} url={review.coverUrl} size="lg" />
        </GatedLink>

        <div className="review-hero__info">
          <GatedLink to={review.targetLink} className="review-hero__link">
            <h1 className="review-hero__title">{review.targetTitle}</h1>
          </GatedLink>

          <p className="review-hero__meta">
            {review.targetKind === 'album' ? (
              <span>Álbum</span>
            ) : (
              <>
                <span>Canción</span>
                <span>Pista {review.song?.numberTrack}</span>
              </>
            )}
          </p>

          <p className="review-hero__subtitle">{review.targetSubtitle}</p>
        </div>
      </div>
    </header>
  );
};
