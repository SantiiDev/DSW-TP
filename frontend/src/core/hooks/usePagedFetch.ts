// Hook para listados que se piden a la API de a tandas y se van acumulando con
// un botón "Ver más" (las reseñas de un ítem, las de un perfil, sus calificados).
//
// Es el hermano de useFetch: aquel reemplaza los datos en cada carga, y acá hay
// que sumar la tanda nueva a lo que ya se mostró. El bloque entero (primera
// tanda, siguiente tanda, saber si queda algo) estaba copiado en cada listado.
//
//   const { items, isLoading, hasMore, loadMore } = usePagedFetch(
//     (limit, offset) => reviewService.list({ userId, limit, offset }),
//     5,
//     `${userId}|${minRating}`
//   );
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * @param fetchPage pide una tanda: recibe cuántos traer y desde dónde.
 * @param pageSize cuántos se muestran por tanda.
 * @param key valor del que depende lo que se pide (un id, un filtro). Al
 *   cambiar, se vuelve a la primera tanda.
 */
export function usePagedFetch<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
  pageSize: number,
  key: string | number = ''
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Mismo criterio que useFetch: la función es nueva en cada render, así que se
  // guarda en una ref para que no dispare cargas sin fin.
  const fetchPageRef = useRef(fetchPage);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  /** Vuelve a la primera tanda (al montar, al cambiar la clave o después de un cambio). */
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Se pide una de más para saber si hay más sin necesitar el total: si
      // vuelven pageSize + 1, la de más se descarta y "hay más" es verdad. Sin
      // esto, cuando el total es justo un múltiplo de pageSize, "Ver más"
      // aparece igual aunque no quede nada, y el click de más parece no hacer nada.
      const batch = await fetchPageRef.current(pageSize + 1, 0);
      setItems(batch.slice(0, pageSize));
      setHasMore(batch.length > pageSize);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload, key]);

  /** Trae la tanda siguiente, arrancando donde terminó lo ya listado. */
  const loadMore = async () => {
    setIsLoadingMore(true);

    try {
      const batch = await fetchPageRef.current(pageSize + 1, items.length);
      setItems((current) => [...current, ...batch.slice(0, pageSize)]);
      setHasMore(batch.length > pageSize);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    items,
    /** Para reemplazar una fila sin recargar (un "me gusta", una edición). */
    setItems,
    isLoading,
    isLoadingMore,
    error,
    setError,
    hasMore,
    reload,
    loadMore,
  };
}
