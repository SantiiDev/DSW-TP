// Barra de búsqueda del listado de artistas: un campo de texto que filtra por
// nombre. Es presentacional; el padre decide qué hacer con el término buscado.
//
// La búsqueda se dispara al enviar el formulario (Enter o el botón) y no en cada
// tecla: el filtro lo resuelve la API, y así se hace una request por búsqueda en
// vez de una por letra.
import type { FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import '../styles/_artist.scss';

type ArtistFilterBarProps = {
  /** Texto que se está escribiendo (lo controla el padre). */
  value: string;
  /** true si hay una búsqueda aplicada: habilita el botón de limpiar. */
  hasActiveSearch: boolean;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export const ArtistFilterBar = ({
  value,
  hasActiveSearch,
  onChange,
  onSearch,
  onClear,
}: ArtistFilterBarProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className="artist-filter" onSubmit={handleSubmit} role="search">
      <div className="artist-filter__field">
        <Search className="artist-filter__icon" size={18} aria-hidden="true" />
        <input
          type="search"
          className="artist-filter__input"
          placeholder="Buscar un artista por nombre..."
          aria-label="Buscar un artista por nombre"
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
