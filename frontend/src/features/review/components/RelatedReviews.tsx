// Bloque de "más reseñas" de la página de detalle. Se monta dos veces con
// filtros distintos: las otras reseñas del mismo autor y las del mismo ítem.
//
// Es una lista corta y de solo lectura: quien quiera gestionar algo entra a la
// reseña. Por eso dibuja ReviewSummaryCard y no ReviewCard.
import { useFetch } from '../../../core/hooks/useFetch';
import { ReviewSummaryCard } from './ReviewSummaryCard';
import { reviewService } from '../services/reviewService';
import type { ReviewFilters } from '../services/reviewService';
import '../styles/_review.scss';

type RelatedReviewsProps = {
  title: string;
  /** Filtros del listado, ya armados por la página. */
  filters: ReviewFilters;
  /**
   * Cambia cuando cambian los filtros, para que se vuelva a pedir. Va aparte
   * porque `filters` es un objeto nuevo en cada render y no sirve como clave.
   */
  fetchKey: string;
  /** La reseña que se está mirando: no tiene sentido ofrecerla de nuevo. */
  excludeId: number;
};

/** Cuántas se muestran. Es una columna lateral, no un listado. */
const VISIBLE = 3;

export const RelatedReviews = ({ title, filters, fetchKey, excludeId }: RelatedReviewsProps) => {
  // Se pide una de más porque después se saca la reseña actual: si no, cuando
  // esta entra en la tanda, se mostrarían menos de las que caben.
  const { data, isLoading, error } = useFetch(
    () => reviewService.list({ ...filters, limit: VISIBLE + 1 }),
    fetchKey
  );

  // Si falla, el bloque no se dibuja: es contenido secundario y un error acá no
  // puede ensuciar la pantalla de la reseña que el usuario vino a leer.
  if (isLoading || error || data === null) return null;

  const reviews = data.filter((review) => review.id !== excludeId).slice(0, VISIBLE);

  if (reviews.length === 0) return null;

  return (
    <section className="related-reviews">
      <h2 className="related-reviews__title">{title}</h2>

      <div className="related-reviews__list">
        {reviews.map((review) => (
          <ReviewSummaryCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
};
