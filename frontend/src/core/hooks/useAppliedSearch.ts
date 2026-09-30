// Estado de un buscador que se aplica al confirmar (Enter o el botón), no en cada
// tecla. Va de la mano con core/components/SearchBar.
//
// Guarda dos textos: lo que se está escribiendo y lo último que se buscó de
// verdad. Separarlos es lo que evita una request por cada letra: el listado se
// vuelve a pedir solo cuando cambia `appliedSearch`.
import { useState } from 'react';

/**
 * @returns el texto que se escribe, el aplicado, y las acciones de aplicar y limpiar.
 */
export function useAppliedSearch() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  return {
    search,
    setSearch,
    appliedSearch,
    applySearch: () => setAppliedSearch(search.trim()),
    clearSearch: () => {
      setSearch('');
      setAppliedSearch('');
    },
  };
}
