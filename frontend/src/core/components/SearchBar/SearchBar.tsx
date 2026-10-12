// Barra de búsqueda reutilizable: un campo de texto con lupa y una cruz para limpiar.
//
// No tiene botón de buscar: el padre busca solo un momento después de la última
// tecla (ver core/hooks/useAppliedSearch), así que el listado se actualiza
// mientras se escribe, sin una request por letra.
//
// Es presentacional: el padre controla el texto y decide qué hacer con él.
//
//   <SearchBar
//     value={search}
//     placeholder="Buscar un álbum por título..."
//     onChange={setSearch}
//     onClear={clearSearch}
//   />
import { Search, X } from 'lucide-react';
import './SearchBar.scss';

type SearchBarProps = {
  /** Texto que se está escribiendo (lo controla el padre). */
  value: string;
  /** Texto de ayuda del campo; también es su nombre accesible. */
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

export const SearchBar = ({ value, placeholder, onChange, onClear }: SearchBarProps) => {
  return (
    <div className="search-bar" role="search">
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

        {/* La cruz propia reemplaza a la del navegador, que no existe en todos. */}
        {value !== '' && (
          <button type="button" className="search-bar__clear" aria-label="Limpiar búsqueda" onClick={onClear}>
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
