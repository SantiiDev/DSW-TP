// Distribución de las calificaciones que puso un usuario, de 0,5 a 5 estrellas.
//
// REVIEW.rating es DECIMAL(2,1) y admite medias estrellas, así que son 10
// barras. Mientras no exista el endpoint de reseñas llegan todas en cero y se
// dibuja la grilla vacía, igual que en la referencia.
import { Star } from 'lucide-react';

type RatingHistogramProps = {
  /** Cantidad de reseñas por cada media estrella, de 0,5 a 5. Diez posiciones. */
  distribution: number[];
};

/** Diez posiciones en cero: el estado mientras no hay reseñas que contar. */
export const EMPTY_DISTRIBUTION: number[] = Array(10).fill(0);

export const RatingHistogram = ({ distribution }: RatingHistogramProps) => {
  // La barra más alta define la escala; con todo en cero se evita dividir por 0.
  const max = Math.max(...distribution, 1);
  const total = distribution.reduce((sum, count) => sum + count, 0);

  return (
    <div className="rating-histogram">
      <div className="rating-histogram__bars">
        {distribution.map((count, index) => {
          const stars = (index + 1) / 2;
          return (
            <div
              key={stars}
              className="rating-histogram__bar-wrapper"
              // El title da el detalle al pasar el mouse sin sumar texto a la UI.
              title={`${count} reseñas de ${stars} ${stars === 1 ? 'estrella' : 'estrellas'}`}
            >
              <div
                className="rating-histogram__bar"
                // El alto es el único valor que no puede vivir en el SCSS: depende
                // de los datos. Se deja un mínimo visible para la grilla vacía.
                style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="rating-histogram__scale">
        <span className="rating-histogram__scale-item">
          0,5 <Star size={11} aria-hidden="true" />
        </span>
        <span className="rating-histogram__total">
          {total === 0 ? 'Sin calificaciones' : `${total} en total`}
        </span>
        <span className="rating-histogram__scale-item">
          5 <Star size={11} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
};
