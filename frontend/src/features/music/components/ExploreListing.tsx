// Listado completo del explorador: la grilla a la que llevan los "Ver todos" de
// /music y las tarjetas de "Explorar por Década".
//
// Es el cuerpo compartido de las dos páginas de listado (la de álbumes y la de
// canciones): las dos muestran la misma grilla y el mismo "Ver más", y se
// diferencian solo en qué le piden a la API. Eso llega como `fetchPage`.
//
// El paginado es del lado del servidor: cada tanda se pide con su `offset`, y el
// botón "Ver más" se muestra mientras la última haya vuelto completa. No hace
// falta que la API devuelva un total.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../core/components/Button';
import { Alert } from '../../../core/components/Alert';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { Disc3 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ExploreItem } from '../models/ExploreItem';
import { ExploreMusicCard } from './ExploreMusicCard';

/**
 * Cuántos ítems trae cada tanda.
 *
 * Son cinco filas exactas de la grilla de escritorio, que va fija en cinco
 * columnas (ver .explore-listing en _music-explore.scss): así la última fila
 * nunca queda a medias con un hueco a la derecha. Si allá cambia la cantidad de
 * columnas, acá hay que cambiar el múltiplo.
 */
const PAGE_SIZE = 25;

type ExploreListingProps = {
  /** Texto chico de arriba del título ("Álbumes", "Canciones"). */
  eyebrow: string;
  /** Qué se está listando ("Mejores calificados", "De 1990 a 1999"). */
  title: string;
  /** Aclaración debajo del título. */
  subtitle: string;
  /**
   * Trae una tanda. Recibe desde qué fila arrancar y cuántas traer, y devuelve
   * los ítems ya normalizados.
   */
  fetchPage: (offset: number, limit: number) => Promise<ExploreItem[]>;
  /**
   * Identifica la consulta actual. Al cambiar (porque cambió el orden o el rango
   * de años de la URL) el listado se reinicia desde la primera tanda.
   */
  queryKey: string;
  /** Enlace de vuelta, al pie de la página. */
  footer: ReactNode;
};

export const ExploreListing = ({
  eyebrow,
  title,
  subtitle,
  fetchPage,
  queryKey,
  footer,
}: ExploreListingProps) => {
  const [items, setItems] = useState<ExploreItem[]>([]);
  // Se distinguen las dos cargas: la primera reemplaza la pantalla entera, la de
  // "Ver más" solo deshabilita el botón mientras llega la tanda.
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Si la última tanda volvió completa, es probable que haya más.
  const [hasMore, setHasMore] = useState(false);

  // El fetcher se guarda en una ref y no se usa como dependencia porque es una
  // función nueva en cada render: si estuviera en las dependencias, cada carga
  // provocaría la siguiente y no pararía nunca. Es el mismo truco que usa
  // core/hooks/useFetch.
  const fetchPageRef = useRef(fetchPage);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  /** Carga la primera tanda y descarta lo que hubiera de la consulta anterior. */
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await fetchPageRef.current(0, PAGE_SIZE);
      setItems(page);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Trae la tanda siguiente y la agrega abajo de lo que ya se está mostrando. */
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPageRef.current(items.length, PAGE_SIZE);
      setItems((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Cargar al montar, y de nuevo cada vez que cambia la consulta: es
  // sincronizar el componente con la API, que es para lo que sirve un efecto.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage();
  }, [loadFirstPage, queryKey]);

  return (
    <main className="explore-listing">
      <header className="explore-listing__header">
        <p className="explore-listing__eyebrow">{eyebrow}</p>
        <h1 className="explore-listing__title">{title}</h1>
        <p className="explore-listing__subtitle">{subtitle}</p>
      </header>

      {isLoading ? (
        <Loader message="Cargando el catálogo..." />
      ) : error && items.length === 0 ? (
        <Alert tone="error">{error}</Alert>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Disc3 size={22} />}
          title="No encontramos nada con ese criterio."
          message="Probá con otra década o volvé a explorar música."
        />
      ) : (
        <>
          <div className="explore-section__grid">
            {items.map((item) => (
              <ExploreMusicCard key={item.id} item={item} />
            ))}
          </div>

          {/* Un error al traer una tanda más no borra lo que ya se estaba
              mostrando: se avisa debajo y el botón sigue disponible. */}
          {error && <Alert tone="error">{error}</Alert>}

          <div className="explore-listing__more">
            <p className="explore-listing__count">
              {items.length === 1 ? '1 resultado' : `${items.length} resultados`}
              {hasMore ? ' hasta ahora.' : ' en total.'}
            </p>

            {hasMore && (
              <Button variant="outline" disabled={isLoadingMore} onClick={handleLoadMore}>
                {isLoadingMore ? 'Cargando...' : 'Ver más'}
              </Button>
            )}
          </div>
        </>
      )}

      {footer}
    </main>
  );
};
