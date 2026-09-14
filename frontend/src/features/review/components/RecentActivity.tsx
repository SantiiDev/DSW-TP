// Actividad reciente de un usuario: sus últimas reseñas en una línea de tiempo
// compacta. Es lo que llena la pestaña "Resumen" del perfil.
//
// Cada fila dice qué calificó, con cuántas estrellas y cuándo, y lleva a la página
// de la reseña. La lista completa, con filtros, edición y baja, sigue siendo la
// pestaña "Reseñas": desde acá se llega con el botón del final.
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button, ButtonLink } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { useFetch } from '../../../core/hooks/useFetch';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { reviewService } from '../services/reviewService';
import { StarRating } from './StarRating';
import '../styles/_recent-activity.scss';

type RecentActivityProps = {
  userId: number;
  username: string;
  isOwnProfile: boolean;
  /** Cambia a la pestaña "Reseñas", con la lista completa. */
  onShowAll: () => void;
};

/** Cuántas reseñas entran en el resumen. */
const RECENT_LIMIT = 6;

export const RecentActivity = ({ userId, username, isOwnProfile, onShowAll }: RecentActivityProps) => {
  // El listado ya viene de la más reciente a la más vieja, así que alcanza con
  // pedir la primera tanda. Se pide una de más para saber si hay más para ver.
  const { data, isLoading, error } = useFetch(
    () => reviewService.list({ userId, limit: RECENT_LIMIT + 1 }),
    userId
  );

  if (isLoading) return <Loader message="Cargando actividad..." />;

  if (error) return <Alert tone="error">{error}</Alert>;

  const reviews = (data ?? []).slice(0, RECENT_LIMIT);
  const hasMore = (data ?? []).length > RECENT_LIMIT;

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={22} />}
        title={isOwnProfile ? 'Todavía no tenés actividad.' : `${username} no tiene actividad todavía.`}
        message={
          isOwnProfile
            ? 'Cuando califiques un álbum o una canción, tu actividad va a aparecer acá.'
            : 'Cuando publique su primera reseña, va a aparecer en esta sección.'
        }
        action={
          isOwnProfile ? (
            <ButtonLink to="/music" size="sm">
              Explorar música
            </ButtonLink>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="recent-activity">
      <ol className="recent-activity__list">
        {reviews.map((review) => (
          <li key={review.id} className="recent-activity__item">
            <Link to={review.sharePath} className="recent-activity__link">
              <AlbumCover title={review.targetTitle} url={review.coverUrl} size="sm" />

              <span className="recent-activity__body">
                <span className="recent-activity__action">
                  {review.targetKind === 'album' ? 'Calificó el álbum' : 'Calificó la canción'}
                </span>
                <span className="recent-activity__title">{review.targetTitle}</span>
                <span className="recent-activity__subtitle">{review.targetSubtitle}</span>
              </span>

              <span className="recent-activity__side">
                <StarRating value={review.rating} size={14} />
                <span className="recent-activity__date">{review.dateLabel}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {hasMore && (
        <Button variant="outline" size="sm" onClick={onShowAll}>
          Ver todas las reseñas
        </Button>
      )}
    </div>
  );
};
