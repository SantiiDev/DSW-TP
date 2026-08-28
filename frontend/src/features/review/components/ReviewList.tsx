// Listado de reseñas con paginado por tandas.
//
// Es puramente de presentación: recibe las reseñas ya cargadas y avisa cuándo hay
// que traer la tanda siguiente. Quien las pide es ReviewsSection.
import { Star } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { ReviewCard } from './ReviewCard';
import type { Review } from '../models/Review';
import '../styles/_review.scss';

type ReviewListProps = {
  reviews: Review[];
  /** true solo en la primera carga: al traer otra tanda no se tapa lo ya listado. */
  isLoading: boolean;
  error: string | null;
  /** Hay más reseñas para traer: se muestra el botón "Ver más". */
  hasMore: boolean;
  /** true mientras se está trayendo la tanda siguiente. */
  isLoadingMore: boolean;
  emptyTitle: string;
  emptyMessage: string;
  hideTarget?: boolean;
  currentUserId: number | null;
  isAdmin: boolean;
  onLoadMore: () => void;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
  onToggleVisibility: (review: Review) => void;
  onToggleLike: (review: Review) => void;
};

export const ReviewList = ({
  reviews,
  isLoading,
  error,
  hasMore,
  isLoadingMore,
  emptyTitle,
  emptyMessage,
  hideTarget = false,
  currentUserId,
  isAdmin,
  onLoadMore,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleLike,
}: ReviewListProps) => {
  if (isLoading) return <Loader message="Cargando reseñas..." />;

  // El error va como mensaje amigable y no como el error crudo de la consola: lo
  // traduce getErrorMessage antes de llegar hasta acá.
  if (error) return <Alert tone="error">{error}</Alert>;

  if (reviews.length === 0) {
    return <EmptyState icon={<Star size={22} />} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          hideTarget={hideTarget}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
          onToggleLike={onToggleLike}
        />
      ))}

      {/* No hace falta saber el total: el botón se muestra mientras la última
          tanda haya vuelto completa. Es el mismo criterio del explorador de
          álbumes. */}
      {hasMore && (
        <div className="review-list__more">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando...' : 'Ver más reseñas'}
          </Button>
        </div>
      )}
    </div>
  );
};
