// Histograma de calificaciones de un usuario, ya con datos reales.
//
// Es un envoltorio delgado sobre el RatingHistogram de la feature user, que es el
// que dibuja las barras: acá solo se piden los números. Se separa así porque las
// estadísticas salen de la tabla REVIEW, o sea de esta feature, mientras que el
// dibujo es parte del diseño del perfil.
//
// OJO con qué mide: son las notas que PUSO el usuario, no cómo lo califican a él.
// Las diez barras son las diez calificaciones posibles, de 0,5 a 5 estrellas.
import { RatingHistogram } from '../../user/components/RatingHistogram';
import { EMPTY_REVIEW_STATS } from '../models/Review';
import type { ReviewStats } from '../models/Review';

type UserRatingHistogramProps = {
  /** Estadísticas ya cargadas, o null mientras se están pidiendo. */
  stats: ReviewStats | null;
};

export const UserRatingHistogram = ({ stats }: UserRatingHistogramProps) => {
  // Mientras cargan se dibuja la grilla vacía en vez de un spinner: el bloque
  // ocupa el mismo lugar y la tarjeta no salta cuando llegan los datos.
  return <RatingHistogram distribution={(stats ?? EMPTY_REVIEW_STATS).distribution} />;
};
