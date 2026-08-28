// Calificación en estrellas, de solo lectura.
//
// Dibuja siempre cinco estrellas y pinta cada una según cuánto le toca del valor,
// así una calificación de 3,5 se ve como tres estrellas llenas y media. La media
// estrella se logra superponiendo la versión rellena sobre la de contorno y
// recortándola con un ancho en porcentaje: es el único modo de mostrar medias sin
// tener dos íconos distintos.
import { Star } from 'lucide-react';
import '../styles/_review.scss';

type StarRatingProps = {
  /** Calificación de 0 a 5. Con 0 quedan las cinco estrellas vacías. */
  value: number;
  /** Tamaño de cada estrella en píxeles. */
  size?: number;
  /** Agrega el número al lado ("4.5"), como en la cabecera de una ficha. */
  showValue?: boolean;
};

/** Las cinco posiciones de la escala. */
const POSITIONS = [1, 2, 3, 4, 5];

export const StarRating = ({ value, size = 16, showValue = false }: StarRatingProps) => {
  return (
    // Una sola etiqueta para el lector de pantalla: leer "estrella" cinco veces no
    // le dice a nadie cuánto vale la reseña.
    <span className="star-rating" role="img" aria-label={`${value} de 5 estrellas`}>
      {POSITIONS.map((position) => {
        // Cuánto de ESTA estrella está pintado: 100% si el valor ya la superó, 50%
        // si le toca la mitad, 0% si el valor no llegó hasta acá.
        const fill = Math.max(0, Math.min(1, value - (position - 1))) * 100;

        return (
          <span key={position} className="star-rating__star" style={{ width: size, height: size }}>
            <Star className="star-rating__outline" size={size} aria-hidden="true" />
            <span className="star-rating__fill" style={{ width: `${fill}%` }}>
              <Star className="star-rating__solid" size={size} aria-hidden="true" />
            </span>
          </span>
        );
      })}

      {showValue && <span className="star-rating__value">{value.toFixed(1)}</span>}
    </span>
  );
};
