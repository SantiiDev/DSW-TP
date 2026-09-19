// Sección de listas en tendencia: feed vertical de tarjetas con las listas más
// nuevas de la comunidad, paginado por el servidor con "Ver más" y "Ver menos".
//
// El paginado es de a `PAGE_SIZE` y no usa useFetch (que reemplaza los datos en
// vez de acumularlos): sigue el mismo patrón que ExploreListing, de la feature
// music, adaptado a un feed más chico dentro de una sola sección.
//
// "Ver menos" vuelve a la primera tanda descartando lo que se había traído. Se
// resuelve así, y no guardando las tandas para no volver a pedirlas, porque el
// feed se ordena por fecha: al volver a desplegar conviene que lo que aparezca
// esté al día y no sea una foto de hace cinco minutos.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Music, TrendingUp } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { EmptyState } from '../../../core/components/EmptyState';
import { Loader } from '../../../core/components/Loader';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { listService } from '../services/listService';
import { TrendingListCard } from './TrendingListCard';
import type { List } from '../models/List';

/**
 * Cuántas listas se ven de entrada, y cuántas suma cada "Ver más". Es el mismo
 * tope que el de "Mis listas" de la barra lateral, para que las dos secciones de
 * la pantalla se desplieguen igual.
 */
const PAGE_SIZE = 5;

type TrendingListsSectionProps = {
  /** Género elegido en la barra lateral, o null para el feed completo. */
  genreId: number | null;
};

export const TrendingListsSection = ({ genreId }: TrendingListsSectionProps) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  /** Trae una tanda desde el offset indicado, ya con el filtro de género vigente. */
  const fetchPage = useCallback(
    (offset: number) =>
      listService.list({ sort: 'recent', genre: genreId ?? undefined, limit: PAGE_SIZE, offset }),
    [genreId]
  );

  // Se guarda en una ref y no como dependencia directa del efecto: es una
  // función nueva en cada render y usarla como dependencia dispararía la carga
  // sin parar nunca (mismo truco que core/hooks/useFetch).
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await fetchPageRef.current(0);
      setLists(page);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
      setLists([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPageRef.current(lists.length);
      setLists((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Vuelve a la primera tanda. `hasMore` queda en true sin preguntarle a la API:
   * si había para plegar es porque ya se habían traído más de las que entran.
   */
  const handleShowLess = () => {
    setLists((current) => current.slice(0, PAGE_SIZE));
    setHasMore(true);
    setError(null);
  };

  // Se recarga desde la primera tanda cada vez que cambia el género elegido.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage, genreId]);

  // Hay algo que plegar solo si se trajo más de una tanda.
  const canShowLess = lists.length > PAGE_SIZE;

  return (
    <section className="trending-lists">
      <SectionHeader icon={<TrendingUp size={22} />} title="Listas en Tendencia" iconTone="fire" />

      {isLoading ? (
        <Loader message="Cargando las listas..." />
      ) : error && lists.length === 0 ? (
        <Alert tone="error">{error}</Alert>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={<Music size={22} />}
          title="Todavía no hay listas para mostrar."
          message='Armá la primera desde "Mis listas", en la barra lateral.'
        />
      ) : (
        <>
          <div className="trending-lists__feed">
            {lists.map((list) => (
              <TrendingListCard key={list.id} list={list} />
            ))}
          </div>

          {/* Un error al traer una tanda más no borra lo que ya se estaba
              mostrando: se avisa debajo y el botón sigue disponible. */}
          {error && <Alert tone="error">{error}</Alert>}

          {/* Los dos botones pueden convivir: con varias tandas traídas y más
              todavía en el servidor, se puede seguir bajando o volver al principio. */}
          {(hasMore || canShowLess) && (
            <div className="trending-lists__more">
              {hasMore && (
                <Button variant="outline" disabled={isLoadingMore} onClick={handleLoadMore}>
                  {isLoadingMore ? (
                    'Cargando...'
                  ) : (
                    <>
                      <ChevronDown size={16} aria-hidden="true" />
                      Ver más
                    </>
                  )}
                </Button>
              )}

              {canShowLess && (
                <Button variant="subtle" disabled={isLoadingMore} onClick={handleShowLess}>
                  <ChevronUp size={16} aria-hidden="true" />
                  Ver menos
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
