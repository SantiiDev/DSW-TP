// Sección de reseñas de un álbum o de una canción: el bloque completo que se
// enchufa en la ficha del ítem.
//
// Es la que pide los datos y coordina las operaciones; la presentación la ponen
// ReviewList y ReviewCard, y el formulario ReviewForm.
//
// No usa el hook useFetch como el resto de las pantallas porque acá el listado se
// va acumulando de a tandas ("Ver más"): useFetch reemplaza los datos en cada
// carga, y lo que hace falta es agregarlos a los que ya están.
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../core/components/Button';
import { ConfirmDialog } from '../../../core/components/Modal';
import { Select } from '../../../core/components/Select';
import type { SelectOption } from '../../../core/components/Select';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { ReviewEditModal } from './ReviewEditModal';
import { ReviewList } from './ReviewList';
import { reviewService } from '../services/reviewService';
import type { Review, ReviewTargetKind } from '../models/Review';
import '../styles/_review.scss';

type ReviewsSectionProps = {
  targetKind: ReviewTargetKind;
  targetId: number;
  /**
   * Se llama después de cada alta, edición o baja. La ficha lo usa para volver a
   * pedir el ítem y refrescar su calificación promedio, que la mantiene este CRUD.
   */
  onReviewChange?: () => void;
};

/** Cuántas reseñas trae cada tanda. */
const PAGE_SIZE = 5;

/**
 * Opciones del filtro por estrellas. 0 significa "sin filtro".
 *
 * Va tipado y no deducido para que el Select sepa que sus valores son números:
 * si no, termina infiriendo `string | number` y no acepta el setter del estado.
 */
const RATING_FILTERS: SelectOption<number>[] = [
  { value: 0, label: 'Todas las calificaciones' },
  { value: 5, label: '5 estrellas' },
  { value: 4, label: '4 estrellas o más' },
  { value: 3, label: '3 estrellas o más' },
  { value: 2, label: '2 estrellas o más' },
  { value: 1, label: '1 estrella o más' },
];

export const ReviewsSection = ({ targetKind, targetId, onReviewChange }: ReviewsSectionProps) => {
  const { state: authState } = useAuth();
  const currentUser = authState.user;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // La reseña propia sobre este ítem, o null si todavía no lo reseñó. Decide si
  // el botón dice "Escribir reseña" o "Editar mi reseña".
  const [myReview, setMyReview] = useState<Review | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  // La reseña que se está editando, o null si se está escribiendo una nueva.
  const [editing, setEditing] = useState<Review | null>(null);

  const [toDelete, setToDelete] = useState<Review | null>(null);

  // El ítem se arma con los dos props sueltos y no llega como objeto: un objeto
  // nuevo en cada render del padre volvería a disparar las cargas sin parar.
  const target = { kind: targetKind, id: targetId };
  const isLogged = currentUser !== null;

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const batch = await reviewService.list({
        target: { kind: targetKind, id: targetId },
        minRating: minRating > 0 ? minRating : undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });

      setReviews(batch);
      // Si la tanda volvió completa puede haber más: es el mismo criterio del
      // explorador de álbumes, que tampoco necesita saber el total.
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [targetKind, targetId, minRating]);

  const loadMyReview = useCallback(async () => {
    if (!isLogged) {
      setMyReview(null);
      return;
    }

    try {
      setMyReview(await reviewService.getMine({ kind: targetKind, id: targetId }));
    } catch {
      // Que falle esto no rompe la sección: solo hace que el botón diga
      // "Escribir reseña" cuando quizás ya había una.
      setMyReview(null);
    }
  }, [isLogged, targetKind, targetId]);

  // Cargar al montar (y cada vez que cambian el ítem o el filtro) es justamente
  // para lo que sirve un efecto: sincronizar el componente con la API.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMyReview();
  }, [loadMyReview]);

  /** Vuelve a pedir todo y avisa a la ficha para que refresque su promedio. */
  const refresh = async () => {
    await loadFirstPage();
    await loadMyReview();
    onReviewChange?.();
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const batch = await reviewService.list({
        target,
        minRating: minRating > 0 ? minRating : undefined,
        limit: PAGE_SIZE,
        // Se arranca donde terminó lo ya listado.
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

  const handleOpenForm = (review: Review | null) => {
    setEditing(review);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;

    const id = toDelete.id;
    setToDelete(null);

    try {
      await reviewService.remove(id);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /**
   * Pone o saca el "me gusta" y reemplaza esa reseña en la lista.
   *
   * No se recarga todo a propósito: un refresh volvería a la primera tanda y
   * perdería lo que el usuario ya había traído con "Ver más".
   */
  const handleToggleLike = async (review: Review) => {
    try {
      const updated = await reviewService.toggleLike(review.id);
      setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      if (review.isHidden) await reviewService.restore(review.id);
      else await reviewService.hide(review.id);

      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const itemLabel = targetKind === 'album' ? 'este álbum' : 'esta canción';

  return (
    <section className="reviews-section">
      <header className="reviews-section__header">
        <h2 className="reviews-section__title">Reseñas</h2>

        <div className="reviews-section__controls">
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

          {isLogged && (
            <Button variant="primary" size="sm" onClick={() => handleOpenForm(myReview)}>
              {myReview ? 'Editar mi reseña' : 'Escribir reseña'}
            </Button>
          )}
        </div>
      </header>

      {/* Si un moderador ocultó la reseña propia, el autor tiene que enterarse:
          si no, vería el botón de editar sin encontrarla en ningún lado. */}
      {myReview?.isHidden && (
        <p className="reviews-section__notice">
          Un moderador ocultó tu reseña, así que no se está mostrando al resto de la comunidad.
        </p>
      )}

      <ReviewList
        reviews={reviews}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        emptyTitle={
          minRating > 0
            ? 'Ninguna reseña llega a esa calificación.'
            : `Todavía no hay reseñas de ${itemLabel}.`
        }
        emptyMessage={
          minRating > 0
            ? 'Probá bajando el filtro de estrellas.'
            : 'Sé el primero en calificarlo y contale a la comunidad qué te pareció.'
        }
        // En la ficha del ítem ya se sabe qué se está reseñando.
        hideTarget
        currentUserId={currentUser?.id ?? null}
        isAdmin={currentUser?.isAdmin ?? false}
        onLoadMore={handleLoadMore}
        onEdit={(review) => handleOpenForm(review)}
        onDelete={setToDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleLike={handleToggleLike}
      />

      <ReviewEditModal
        isOpen={isFormOpen}
        review={editing}
        target={target}
        itemLabel={itemLabel}
        onClose={() => setIsFormOpen(false)}
        // Después de publicar o editar hay que rehacer el listado y avisarle a la
        // ficha, porque el promedio del álbum cambió.
        onSaved={() => void refresh()}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar la reseña"
        message="La reseña se borra definitivamente y el promedio se recalcula sin ella. Después vas a poder escribir una nueva."
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
};
