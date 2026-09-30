// Hilo de comentarios de una reseña: la lista y el campo para responder.
//
// Se monta recién cuando alguien despliega el globo de la tarjeta, y ahí pide los
// comentarios. Antes de eso solo se muestra el número, que ya viene con la reseña:
// traer el texto de todos los hilos de un listado sería mandar datos que casi
// nadie mira.
import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Avatar } from '../../../core/components/Avatar';
import { Button } from '../../../core/components/Button';
import { TextInput } from '../../../core/components/FormField';
import { GatedLink } from '../../../core/components/GatedLink';
import { ConfirmDialog } from '../../../core/components/Modal';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { fieldErrorProps, maxLength, validateField } from '../../../core/utils/validators';
import { RoleBadge } from '../../user/components/RoleBadge';
import { reviewService } from '../services/reviewService';
import type { ReviewComment } from '../models/Review';
import '../styles/_review.scss';

type ReviewCommentsProps = {
  reviewId: number;
  currentUserId: number | null;
  isAdmin: boolean;
  /**
   * Cómo se dibuja el hilo:
   * - 'compact' (por defecto): dentro de una tarjeta del listado, con el campo y
   *   el botón en una sola fila.
   * - 'page': en la página de la reseña, donde hay lugar para un campo ancho con
   *   el botón debajo.
   */
  variant?: 'compact' | 'page';
  /** Avisa cuántos quedaron, para que la tarjeta actualice su contador. */
  onCountChange: (count: number) => void;
};

// Mismo techo y mensaje que valida el backend (ver createCommentSchema).
const MAX_LENGTH = 1000;
const LENGTH_RULES = [
  maxLength(MAX_LENGTH, `El comentario no puede tener más de ${MAX_LENGTH} caracteres.`),
];

export const ReviewComments = ({
  reviewId,
  currentUserId,
  isAdmin,
  variant = 'compact',
  onCountChange,
}: ReviewCommentsProps) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');

  // El error de largo se muestra en vivo: solo aparece cuando realmente se pasó
  // del tope, así que no marca nada antes de tiempo.
  const commentInputId = `comment-${reviewId}`;
  const lengthError = validateField(text, LENGTH_RULES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Comentario que se está por borrar, o null si no hay ninguno esperando
  // confirmación. Borrar es irreversible, así que se pregunta primero, igual que
  // con la baja de una reseña.
  const [toDelete, setToDelete] = useState<ReviewComment | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setComments(await reviewService.listComments(reviewId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = text.trim();
    if (trimmed === '' || lengthError || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await reviewService.addComment(reviewId, trimmed);
      // Se agrega al final porque el hilo va del más viejo al más nuevo.
      setComments((current) => {
        const next = [...current, created];
        onCountChange(next.length);
        return next;
      });
      setText('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    const id = toDelete.id;
    setToDelete(null);

    try {
      await reviewService.removeComment(reviewId, id);
      setComments((current) => {
        const next = current.filter((item) => item.id !== id);
        onCountChange(next.length);
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={`review-comments review-comments--${variant}`}>
      {error && <Alert tone="error">{error}</Alert>}

      {isLoading ? (
        <p className="review-comments__loading">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="review-comments__empty">Todavía no comentó nadie. Empezá vos.</p>
      ) : (
        <ul className="review-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="review-comments__item">
              {/* Avatar y nombre llevan al perfil del que comentó, igual que en la
                  tarjeta de la reseña. Sin autor (cuenta borrada) quedan como texto. */}
              {comment.author ? (
                <GatedLink
                  to={`/users/${comment.author.id}`}
                  className="review-comments__avatar-link"
                  ariaLabel={`Ver el perfil de ${comment.authorName}`}
                >
                  <Avatar url={comment.author.avatarUrl} username={comment.authorName} size="sm" />
                </GatedLink>
              ) : (
                <Avatar url={null} username={comment.authorName} size="sm" />
              )}

              <div
                className={
                  comment.authorAccent
                    ? `review-comments__body review-comments__body--accent-${comment.authorAccent}`
                    : 'review-comments__body'
                }
              >
                <p className="review-comments__meta">
                  {comment.author ? (
                    <GatedLink
                      to={`/users/${comment.author.id}`}
                      className="review-comments__author review-comments__author-link"
                    >
                      {comment.authorName}
                    </GatedLink>
                  ) : (
                    <span className="review-comments__author">{comment.authorName}</span>
                  )}
                  <RoleBadge rol={comment.authorRol} accent={comment.authorAccent} />
                  <span className="review-comments__date">{comment.dateLabel}</span>
                </p>
                <p className="review-comments__text">{comment.text}</p>
              </div>

              {comment.canBeDeletedBy(currentUserId, isAdmin) && (
                <button
                  type="button"
                  className="review-comments__delete"
                  aria-label="Eliminar comentario"
                  onClick={() => setToDelete(comment)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Sin sesión no se puede comentar, así que directamente no se muestra el
          campo: es más claro que dejarlo puesto y que falle al enviar. */}
      {currentUserId !== null && (
        <form className="review-comments__form" onSubmit={handleSubmit} noValidate>
          <TextInput
            id={commentInputId}
            placeholder="Escribí un comentario..."
            value={text}
            disabled={isSubmitting}
            onChange={(e) => setText(e.target.value)}
            aria-label="Escribí un comentario"
            {...fieldErrorProps(commentInputId, lengthError)}
          />
          <Button
            type="submit"
            variant="primary"
            // En la página el botón ocupa el ancho, debajo del campo; en una
            // tarjeta del listado va chico y al lado.
            size={variant === 'page' ? 'md' : 'sm'}
            fullWidth={variant === 'page'}
            // Vacío no hay nada que mandar: es el patrón de cualquier caja de
            // comentarios y se entiende sin mensaje. El largo sí se explica abajo.
            disabled={text.trim() === '' || isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Comentar'}
          </Button>
        </form>
      )}
      {lengthError && (
        <p className="form-field__error" id={`${commentInputId}-error`}>
          {lengthError}
        </p>
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar el comentario"
        message="El comentario se borra definitivamente y no se puede recuperar."
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
