// Diálogo para escribir o editar una reseña.
//
// Junta las tres cosas que antes estaban copiadas en cada pantalla que deja
// calificar: el marco (FormModal), el formulario (ReviewForm) y la llamada a la
// API con su estado de "enviando" y su error. Lo usan la sección de reseñas de
// una ficha, la página de una reseña y el listado del perfil.
//
// Sirve para el alta y para la edición porque son el mismo formulario: cambian
// el título, el texto de ayuda y a qué endpoint se le pega.
import { useState } from 'react';
import { FormModal } from '../../../core/components/FormModal';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { ReviewForm } from './ReviewForm';
import { reviewService } from '../services/reviewService';
import type { ReviewInput, ReviewTarget } from '../services/reviewService';
import type { Review } from '../models/Review';

type ReviewEditModalProps = {
  isOpen: boolean;
  /** La reseña que se está editando, o null si se está escribiendo una nueva. */
  review: Review | null;
  /** El ítem que se reseña. Solo hace falta para el alta. */
  target?: ReviewTarget;
  /** Cómo nombrar el ítem en el texto de ayuda ("este álbum", "esta canción"). */
  itemLabel?: string;
  onClose: () => void;
  /** Recibe la reseña ya guardada, para que la pantalla se actualice. */
  onSaved: (review: Review) => void;
};

export const ReviewEditModal = ({
  isOpen,
  review,
  target,
  itemLabel = 'este ítem',
  onClose,
  onSaved,
}: ReviewEditModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = review !== null;

  const handleSubmit = async (input: ReviewInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const saved =
        review !== null
          ? await reviewService.update(review.id, input)
          : // El alta necesita saber qué se está reseñando. Si no vino el ítem es
            // un error de programación, no algo que pueda hacer el usuario.
            await reviewService.create(target!, input);

      onSaved(saved);
      onClose();
    } catch (err) {
      // El error se muestra dentro del modal para no perder lo escrito.
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      title={isEditing ? 'Editar mi reseña' : 'Escribir una reseña'}
      hint={
        isEditing
          ? 'Los cambios reemplazan lo que habías publicado.'
          : `Tu calificación entra en el promedio de ${itemLabel} apenas la publiques.`
      }
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      {/* La key fuerza a rearmar el formulario al pasar de "escribir" a "editar"
          o de una reseña a otra: si no, conservaría el estado de la vez anterior. */}
      <ReviewForm
        key={review?.id ?? 'nueva'}
        initialRating={review?.rating ?? 0}
        initialText={review?.text ?? ''}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
