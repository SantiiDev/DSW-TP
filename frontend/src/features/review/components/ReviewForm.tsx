// Formulario para publicar o editar una reseña: la calificación en estrellas y un
// texto opcional.
//
// Va adentro del FormModal de core/components, que pone el marco, el título y el
// lugar del error. Este componente se ocupa solo de los campos.
import { useState } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
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

export const ReviewForm = ({
  initialRating = 0,
  initialText = '',
  isSubmitting,
  onSubmit,
  onCancel,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);

  // Sin calificación no hay reseña: el texto es lo opcional, no la nota. Se avisa
  // acá para no gastar una request que el backend va a rechazar igual.
  const canSubmit = rating > 0 && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trimmed = text.trim();
    // El string vacío viaja como null: en la base "sin texto" es NULL, no ''.
    onSubmit({ rating, textReview: trimmed === '' ? null : trimmed });
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <FormField id="review-rating" label="Tu calificación">
        <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
      </FormField>

      <FormField id="review-text" label="Tu reseña" hint="(opcional)">
        <TextInput
          as="textarea"
          id="review-text"
          rows={6}
          maxLength={MAX_TEXT_LENGTH}
          placeholder="¿Qué te pareció? Podés dejarlo en blanco y calificar nomás."
          value={text}
          disabled={isSubmitting}
          onChange={(e) => setText(e.target.value)}
        />
      </FormField>

      <p className="review-form__counter">
        {text.length} / {MAX_TEXT_LENGTH}
      </p>

      <div className="review-form__actions">
        <Button variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {isSubmitting ? 'Guardando...' : 'Publicar reseña'}
        </Button>
      </div>
    </form>
  );
};
