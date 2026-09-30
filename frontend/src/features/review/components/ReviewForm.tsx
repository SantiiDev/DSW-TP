// Formulario para publicar o editar una reseña: la calificación en estrellas y un
// texto opcional.
//
// Va adentro del FormModal de core/components, que pone el marco, el título y el
// lugar del error. Este componente se ocupa solo de los campos.
//
// Valida con reglas propias (core/utils/validators), no con las del navegador.
import { useState } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { fieldErrorProps, hasErrors, maxLength, validateField } from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';
import { StarRatingInput } from './StarRatingInput';
import type { ReviewInput } from '../services/reviewService';
import '../styles/_review.scss';

type ReviewFormProps = {
  /** Calificación con la que arranca. 0 en un alta, la guardada en una edición. */
  initialRating?: number;
  initialText?: string;
  isSubmitting: boolean;
  onSubmit: (input: ReviewInput) => void;
  onCancel: () => void;
};

// Mismo techo que valida el backend (ver review.schema.ts). Se repite acá para
// poder mostrar el contador de caracteres mientras se escribe.
const MAX_TEXT_LENGTH = 5000;

/**
 * Valida la reseña. Sin calificación no hay reseña: el texto es lo opcional, no
 * la nota. Las estrellas solo permiten medias estrellas de 0,5 a 5, así que
 * alcanza con que haya una elegida.
 */
function validateReviewForm(rating: number, text: string): FieldErrors<'rating' | 'text'> {
  return {
    rating: rating > 0 ? undefined : 'Elegí una calificación: la reseña necesita al menos media estrella.',
    text: validateField(text, [
      maxLength(MAX_TEXT_LENGTH, `La reseña no puede tener más de ${MAX_TEXT_LENGTH} caracteres.`),
    ]),
  };
}

export const ReviewForm = ({
  initialRating = 0,
  initialText = '',
  isSubmitting,
  onSubmit,
  onCancel,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  // Errores visibles recién después del primer intento de publicar; desde ahí se
  // recalculan en cada cambio. Antes, sin calificación, el botón quedaba
  // deshabilitado sin decir por qué.
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const errors: FieldErrors<'rating' | 'text'> = wasSubmitted
    ? validateReviewForm(rating, text)
    : {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateReviewForm(rating, text))) return;

    const trimmed = text.trim();
    // El string vacío viaja como null: en la base "sin texto" es NULL, no ''.
    onSubmit({ rating, textReview: trimmed === '' ? null : trimmed });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <FormField id="review-rating" label="Tu calificación" error={errors.rating}>
        <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
      </FormField>

      <FormField id="review-text" label="Tu reseña" hint="(opcional)" error={errors.text}>
        <TextInput
          as="textarea"
          id="review-text"
          rows={6}
          placeholder="¿Qué te pareció? Podés dejarlo en blanco y calificar nomás."
          value={text}
          disabled={isSubmitting}
          onChange={(e) => setText(e.target.value)}
          {...fieldErrorProps('review-text', errors.text)}
        />
      </FormField>

      <p
        className={`review-form__counter ${
          text.length > MAX_TEXT_LENGTH ? 'review-form__counter--over' : ''
        }`}
      >
        {text.length} / {MAX_TEXT_LENGTH}
      </p>

      <div className="review-form__actions">
        <Button variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Publicar reseña'}
        </Button>
      </div>
    </form>
  );
};
