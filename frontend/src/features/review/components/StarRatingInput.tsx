// Selector de calificación: las mismas cinco estrellas del StarRating, pero para
// elegir. Es el control con el que se califica un álbum o una canción.
//
// Cada estrella se parte en dos botones invisibles superpuestos: la mitad
// izquierda elige la media estrella (2,5) y la derecha la entera (3). Así se
// cubren las diez calificaciones posibles sin agregar un control aparte.
//
// El valor y el aviso de cambio vienen de afuera (input y output property); lo
// único que el componente guarda para sí es la estrella sobre la que está el
// mouse, que solo sirve para la vista previa.
import { useState } from 'react';
import { Star } from 'lucide-react';
import { MAX_RATING, RATING_STEP } from '../models/Review';
import '../styles/_review.scss';

type StarRatingInputProps = {
  /** Calificación elegida. 0 significa que todavía no eligió ninguna. */
  value: number;
  /** Avisa la calificación nueva al hacer click. */
  onChange: (value: number) => void;
  disabled?: boolean;
};

const POSITIONS = [1, 2, 3, 4, 5];

export const StarRatingInput = ({ value, onChange, disabled = false }: StarRatingInputProps) => {
  // Calificación que está señalando el mouse, o null si no está sobre el control.
  // Es estado local a propósito: es una vista previa, no la elección.
  const [hovered, setHovered] = useState<number | null>(null);

  // Lo que se dibuja: la vista previa si el mouse está encima, y si no, lo elegido.
  const shown = hovered ?? value;

  /**
   * Deja elegida una calificación.
   * @param rating valor de esa mitad de estrella.
   */
  const handleSelect = (rating: number) => {
    if (!disabled) onChange(rating);
  };

  return (
    <div className="star-input">
      <div
        className="star-input__stars"
        // Al salir del control se descarta la vista previa y vuelve a verse lo
        // que estaba elegido.
        onMouseLeave={() => setHovered(null)}
      >
        {POSITIONS.map((position) => {
          const fill = Math.max(0, Math.min(1, shown - (position - 1))) * 100;
          const half = position - RATING_STEP;

          return (
            <span key={position} className="star-input__star">
              <Star className="star-input__outline" size={30} aria-hidden="true" />
              <span className="star-input__fill" style={{ width: `${fill}%` }}>
                <Star className="star-input__solid" size={30} aria-hidden="true" />
              </span>

              {/* Las dos mitades clickeables van encima del dibujo. Son botones de
                  verdad y no divs con onClick para que se puedan tabular y
                  activar con el teclado. */}
              <button
                type="button"
                className="star-input__half star-input__half--left"
                disabled={disabled}
                aria-label={`${half} de ${MAX_RATING} estrellas`}
                onMouseEnter={() => setHovered(half)}
                onFocus={() => setHovered(half)}
                onBlur={() => setHovered(null)}
                onClick={() => handleSelect(half)}
              />
              <button
                type="button"
                className="star-input__half star-input__half--right"
                disabled={disabled}
                aria-label={`${position} de ${MAX_RATING} estrellas`}
                onMouseEnter={() => setHovered(position)}
                onFocus={() => setHovered(position)}
                onBlur={() => setHovered(null)}
                onClick={() => handleSelect(position)}
              />
            </span>
          );
        })}
      </div>

      <span className="star-input__value">
        {shown > 0 ? `${shown.toFixed(1)} / ${MAX_RATING}` : 'Elegí una calificación'}
      </span>
    </div>
  );
};
