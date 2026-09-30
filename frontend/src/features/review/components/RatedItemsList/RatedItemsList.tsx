// Grilla de los álbumes o de las canciones que un usuario calificó.
//
// Es lo que llena las pestañas "Álbumes" y "Canciones" del perfil. Se monta dos
// veces, una por tipo de ítem, y cada una pide lo suyo con el filtro `target` del
// listado de reseñas.
//
// No hay una tabla de "ítems calificados": lo que un usuario calificó son sus
// reseñas, miradas del lado del ítem en vez del lado del texto. El índice único
// por usuario e ítem garantiza que no aparezca nada repetido.
//
// No usa useFetch porque el listado se va acumulando de a tandas ("Ver más"), y
// ese hook reemplaza los datos en cada carga en vez de agregarlos.
import { Disc3, Music } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { Button } from '../../../../core/components/Button';
import { EmptyState } from '../../../../core/components/EmptyState';
import { Loader } from '../../../../core/components/Loader';
import { usePagedFetch } from '../../../../core/hooks/usePagedFetch';
import { RatedItemCard } from '../RatedItemCard';
import { reviewService } from '../../services/reviewService';
import type { ReviewTargetKind } from '../../models/Review';
import './RatedItemsList.scss';

type RatedItemsListProps = {
  userId: number;
  username: string;
  /** Qué se lista: los álbumes calificados o las canciones calificadas. */
  kind: ReviewTargetKind;
  /** true si se está mirando el perfil propio: cambia los textos del vacío. */
  isOwnProfile: boolean;
};

/** Cuántos ítems trae cada tanda. Es una grilla, así que entran más que en una lista. */
const PAGE_SIZE = 12;

/** Los textos y el ícono que cambian entre una pestaña y la otra. */
const COPY = {
  album: {
    icon: <Disc3 size={22} aria-hidden="true" />,
    own: 'No calificaste ningún álbum.',
    other: (name: string) => `${name} no calificó álbumes.`,
    ownMessage: 'Entrá a un álbum y ponele una nota: los que califiques se van a mostrar acá.',
    otherMessage: 'Cuando califique su primer álbum, va a aparecer en esta grilla.',
  },
  song: {
    icon: <Music size={22} aria-hidden="true" />,
    own: 'No calificaste ninguna canción.',
    other: (name: string) => `${name} no calificó canciones.`,
    ownMessage: 'Cada canción de un álbum se puede calificar por separado, desde su ficha.',
    otherMessage: 'Cuando califique su primera canción, va a aparecer en esta grilla.',
  },
} as const;

export const RatedItemsList = ({ userId, username, kind, isOwnProfile }: RatedItemsListProps) => {
  // Se pide por tandas y se acumula con "Ver más"; cambiar de perfil o de pestaña
  // vuelve a la primera.
  const { items, isLoading, isLoadingMore, error, hasMore, loadMore } = usePagedFetch(
    (limit, offset) => reviewService.list({ userId, targetKind: kind, limit, offset }),
    PAGE_SIZE,
    `${userId}|${kind}`
  );

  if (isLoading) return <Loader message="Cargando..." />;

  if (error) return <Alert tone="error">{error}</Alert>;

  const copy = COPY[kind];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={copy.icon}
        title={isOwnProfile ? copy.own : copy.other(username)}
        message={isOwnProfile ? copy.ownMessage : copy.otherMessage}
      />
    );
  }

  return (
    <div className="rated-items">
      <div className="rated-items__grid">
        {items.map((review) => (
          <RatedItemCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="rated-items__more">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando...' : 'Ver más'}
          </Button>
        </div>
      )}
    </div>
  );
};
