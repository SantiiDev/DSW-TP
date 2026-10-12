// Paginado del lado del cliente con un botón "Ver más".
//
// La lista ya llegó entera de la API; lo que se pagina es cuánto se dibuja. Sin
// esto, un catálogo de cientos de filas arma una tabla larguísima que obliga a
// scrollear para llegar a cualquier cosa. Lo usan las tablas del panel de
// administración, las colas de solicitudes y los aportes del perfil.
//
//   const { visibleItems, hasMore, showMore } = useShowMore(albums, 15, filtro);
import { useState } from 'react';

/**
 * @param items la lista completa.
 * @param pageSize cuántos se muestran de entrada y cuántos suma cada "Ver más".
 * @param resetKey opcional: cuando cambia (por ejemplo, otro filtro), se vuelve a
 *   la primera página. El "Ver más" de un resultado no tiene sentido sobre otro.
 * @returns lo que hay que dibujar, si queda algo por mostrar y la acción de sumar más.
 */
export function useShowMore<T>(items: T[], pageSize: number, resetKey?: string) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // El reinicio se hace durante el render, comparando contra la última clave
  // vista, y no en un useEffect: con el efecto se dibujaba una vez de más con la
  // cantidad vieja.
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setVisibleCount(pageSize);
  }

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: items.length > visibleCount,
    showMore: () => setVisibleCount((current) => current + pageSize),
  };
}
