// Listado de las reseñas que publicó un usuario, con filtro por estrellas.
//
// Es lo que llena la pestaña "Reseñas" del perfil. Cada feature aporta su propia
// lista y el perfil solo la monta, que es el mismo criterio con el que la pestaña
// "Aportes" arma las de artistas, álbumes y canciones.
//
// A diferencia de ReviewsSection acá no se PUBLICA: una reseña nueva se escribe
// desde la ficha del ítem, que es donde uno está cuando quiere calificar algo.
// Editar y borrar las ya publicadas, en cambio, sí se hace desde acá.
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../../core/components/Modal';
import { Select } from '../../../core/components/Select';
import type { SelectOption } from '../../../core/components/Select';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { ReviewEditModal } from './ReviewEditModal';
import { ReviewList } from './ReviewList';
import { reviewService } from '../services/reviewService';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type UserReviewsListProps = {
  userId: number;
  username: string;
  /** true si se está mirando el perfil propio: cambia los textos del vacío. */
  isOwnProfile: boolean;
  /** Avisa cuando se borra una reseña, para que el perfil refresque sus contadores. */
  onReviewsChange?: () => void;
};

/** Cuántas reseñas trae cada tanda. */
const PAGE_SIZE = 5;

/** Opciones del filtro por estrellas. 0 significa "sin filtro". */
const RATING_FILTERS: SelectOption<number>[] = [
  { value: 0, label: 'Todas las calificaciones' },
  { value: 5, label: '5 estrellas' },
  { value: 4, label: '4 estrellas o más' },
  { value: 3, label: '3 estrellas o más' },
  { value: 2, label: '2 estrellas o más' },
  { value: 1, label: '1 estrella o más' },
];

export const UserReviewsList = ({
  userId,
  username,
  isOwnProfile,
  onReviewsChange,
}: UserReviewsListProps) => {
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  // La reseña que se está editando, o null si el diálogo está cerrado.
  const [editing, setEditing] = useState<Review | null>(null);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const batch = await reviewService.list({
        userId,
        minRating: minRating > 0 ? minRating : undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });

      setReviews(batch);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId, minRating]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const batch = await reviewService.list({
        userId,
        minRating: minRating > 0 ? minRating : undefined,
        limit: PAGE_SIZE,
        offset: reviews.length,
      });

      setReviews((current) => [...current, ...batch]);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Reemplaza una sola reseña en la lista, sin recargar: un refresh volvería a la
  // primera tanda y perdería lo que ya se trajo con "Ver más".
  const replaceReview = (updated: Review) => {
    setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleToggleLike = async (review: Review) => {
    try {
      replaceReview(await reviewService.toggleLike(review.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      replaceReview(
        review.isHidden
          ? await reviewService.restore(review.id)
          : await reviewService.hide(review.id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    const id = toDelete.id;
    setToDelete(null);

    try {
      await reviewService.remove(id);
      await loadFirstPage();
      onReviewsChange?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="user-reviews">
      <div className="user-reviews__filters">
        <Select
          options={RATING_FILTERS}
          value={minRating}
          // Va envuelto y no como `setMinRating` a secas: el tipo que espera un
          // setter de useState admite también una función, y con eso TypeScript
          // no logra deducir cuál es el tipo de las opciones.
          onChange={(value) => setMinRating(value)}
          ariaLabel="Filtrar reseñas por calificación"
          size="sm"
        />
      </div>

      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        emptyTitle={
          minRating > 0
            ? 'Ninguna reseña llega a esa calificación.'
            : isOwnProfile
              ? 'No publicaste ninguna reseña.'
              : `${username} no publicó reseñas.`
        }
        emptyMessage={
          minRating > 0
            ? 'Probá bajando el filtro de estrellas.'
            : isOwnProfile
              ? 'Entrá a un álbum o a una canción y calificalo: tus reseñas se van a listar acá.'
              : 'Cuando publique su primera reseña, va a aparecer en esta sección.'
        }
        currentUserId={currentUser?.id ?? null}
        isAdmin={currentUser?.isAdmin ?? false}
        onLoadMore={handleLoadMore}
        // Se edita acá mismo, con el mismo diálogo que la ficha del ítem y la
        // página de la reseña: mandar a otra pantalla para cambiar una nota era
        // un rodeo, ahora que el formulario vive en un componente compartido.
        onEdit={setEditing}
        onDelete={setToDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleLike={handleToggleLike}
      />

      <ReviewEditModal
        isOpen={editing !== null}
        review={editing}
        onClose={() => setEditing(null)}
        // Se reemplaza solo esa reseña y se avisa al perfil, porque cambió su
        // calificación y con ella el histograma.
        onSaved={(updated) => {
          replaceReview(updated);
          onReviewsChange?.();
        }}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar la reseña"
        message="La reseña se borra definitivamente y el promedio del ítem se recalcula sin ella."
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};
