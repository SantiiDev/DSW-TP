// Sección de tags: los géneros del catálogo, para filtrar el feed de listas.
// Reemplaza los catorce chips con emoji de la versión mock (inventados, sin
// ninguna acción real) por los géneros reales de GET /api/genres.
import { Compass } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Loader } from '../../../core/components/Loader';
import { useFetch } from '../../../core/hooks/useFetch';
import { genreService } from '../../genre/services/genreService';

type ExploreTagsSectionProps = {
  /** Género elegido, o null si no hay filtro. */
  selectedGenreId: number | null;
  onSelectGenre: (id: number | null) => void;
};

export const ExploreTagsSection = ({
  selectedGenreId,
  onSelectGenre,
}: ExploreTagsSectionProps) => {
  const { data, isLoading, error } = useFetch(() => genreService.list());
  const genres = data ?? [];

  /** Clickear el género ya activo lo destilda: vuelve a mostrarse el feed completo. */
  const handleClick = (id: number) => {
    onSelectGenre(selectedGenreId === id ? null : id);
  };

  return (
    <section className="explore-tags">
      <div className="explore-tags__header">
        <Compass size={20} className="explore-tags__header-icon" aria-hidden="true" />
        {/* "Explorar por Género" y no "Explorar Listas": ese título ya lo tiene
            el <h1> de la página (ver ListsExplorePage). */}
        <h2 className="explore-tags__title">Explorar por Género</h2>
      </div>

      {isLoading ? (
        <Loader message="Cargando los géneros..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : (
        <div className="explore-tags__grid">
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              className={`explore-tag ${selectedGenreId === genre.id ? 'explore-tag--active' : ''}`}
              aria-pressed={selectedGenreId === genre.id}
              onClick={() => handleClick(genre.id)}
            >
              <span className="explore-tag__label">{genre.name}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
