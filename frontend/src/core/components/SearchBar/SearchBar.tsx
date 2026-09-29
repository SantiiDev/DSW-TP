// Barra de búsqueda reutilizable: un campo de texto con lupa, el botón de buscar
// y el de limpiar.
//
// La búsqueda se dispara al enviar el formulario (Enter o el botón) y no en cada
// tecla: el filtro lo resuelve la API, y así se hace una request por búsqueda en
// vez de una por letra.
//
// Es presentacional: el padre controla el texto y decide qué hacer con él.
//
//   <SearchBar
//     value={search}
//     placeholder="Buscar un álbum por título..."
//     hasActiveSearch={appliedSearch !== ''}
//     onChange={setSearch}
//     onSearch={handleSearch}
//     onClear={handleClearSearch}
//   />
import type { FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './Button';
import './_search-bar.scss';

type SearchBarProps = {
  /** Texto que se está escribiendo (lo controla el padre). */
  value: string;
  /** Texto de ayuda del campo; también es su nombre accesible. */
  placeholder: string;
  /** true si hay una búsqueda aplicada: habilita el botón de limpiar. */
  hasActiveSearch: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export const SearchBar = ({
  value,
  placeholder,
  hasActiveSearch,
  onChange,
  onSearch,
  onClear,
}: SearchBarProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar__field">
        <Search className="search-bar__icon" size={18} aria-hidden="true" />
        <input
          type="search"
          className="search-bar__input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <Button type="submit">Buscar</Button>

      {hasActiveSearch && (
        <Button variant="subtle" onClick={onClear}>
          <X size={16} aria-hidden="true" />
          Limpiar
        </Button>
      )}
    </form>
  );
};
