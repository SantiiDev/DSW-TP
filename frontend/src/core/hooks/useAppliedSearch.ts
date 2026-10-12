// Estado de un buscador que se aplica solo, un momento después de la última tecla.
// Va de la mano con core/components/SearchBar.
//
// Guarda dos textos: lo que se está escribiendo y lo que se busca de verdad.
// Separarlos es lo que evita una request por cada letra: el listado se vuelve a
// pedir solo cuando cambia `appliedSearch`, que se actualiza cuando el usuario
// hace una pausa al escribir.
import { useEffect, useState } from 'react';

/** Pausa desde la última tecla antes de aplicar la búsqueda (igual que NavbarSearch). */
const DEBOUNCE_MS = 300;

/**
 * @returns el texto que se escribe, el aplicado (ya recortado) y la acción de limpiar.
 */
export function useAppliedSearch() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Si se sigue escribiendo, el temporizador anterior se cancela: solo cuenta la
  // última pausa.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  return {
    search,
    setSearch,
    appliedSearch,
    // Limpiar aplica al instante, sin esperar la pausa.
    clearSearch: () => {
      setSearch('');
      setAppliedSearch('');
    },
  };
}
