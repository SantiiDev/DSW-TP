// Ficha pública de un género: sus álbumes, con un panel de filtros al costado.
// Es a donde llevan las tarjetas de "Explorar por Género" en /music.
//
// El listado de géneros no vive acá sino en esa grilla del explorador: son once y
// entran todos en pantalla, así que una página aparte solo para listarlos
// duplicaría lo mismo.
//
// Es una página pública, igual que el explorador: leer géneros no pide token.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Disc3, LayoutGrid, List } from 'lucide-react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { genreService } from '../services/genreService';
import type { Genre, GenreAlbum } from '../models/Genre';
import { GenreAlbumList } from '../components/GenreAlbumList';
import type { AlbumView } from '../components/GenreAlbumList';
import { GenreFilters } from '../components/GenreFilters';
import type { YearMode } from '../components/GenreFilters';
import '../styles/_genre.scss';

/**
 * Aplica el filtro de año sobre los álbumes del género.
 *
 * El filtrado se hace acá y no en la API a propósito: la ficha ya trajo todos los
 * álbumes del género (el más grande tiene 83), así que cambiar de año se resuelve
 * al instante y sin una request nueva.
 *
 * @param albums álbumes públicos del género.
 * @param year año elegido, o null si no hay filtro.
 * @param mode 'exact' para solo ese año, 'from' para ese en adelante.
 */
function filterByYear(albums: GenreAlbum[], year: number | null, mode: YearMode): GenreAlbum[] {
  if (year === null) return albums;

  return albums.filter((album) => {
    if (album.releaseYear === null) return false;
    return mode === 'exact' ? album.releaseYear === year : album.releaseYear >= year;
  });
}

export const GenreDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [genre, setGenre] = useState<Genre | null>(null);
  // Todos los géneros, solo para el desplegable que permite saltar a otro.
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<AlbumView>('list');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearMode, setYearMode] = useState<YearMode>('exact');

  const loadGenre = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Las dos consultas son independientes, así que salen juntas en vez de una
      // después de la otra.
      const [detail, all] = await Promise.all([
        genreService.getById(Number(id)),
        genreService.list(),
      ]);

      setGenre(detail);
      setGenres(all);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGenre();
  }, [loadGenre]);

  // Al cambiar de género el filtro de año se reinicia: los años del género
  // anterior no tienen por qué existir en el nuevo.
  useEffect(() => {
    setSelectedYear(null);
    setYearMode('exact');
  }, [id]);

  // Solo los álbumes aprobados: los que un usuario PRO propuso y todavía nadie
  // revisó no forman parte del catálogo público.
  const publicAlbums = useMemo(() => genre?.publicAlbums ?? [], [genre]);

  const visibleAlbums = useMemo(
    () => filterByYear(publicAlbums, selectedYear, yearMode),
    [publicAlbums, selectedYear, yearMode]
  );

  /** Saltar a otro género es navegar: el contenido de la página cambia entero. */
  const handleGenreChange = (nextId: number) => {
    navigate(`/genres/${nextId}`);
  };

  return (
    <>
      <Navbar />

      <main className="genre-detail">
        {isLoading ? (
          <Loader message="Cargando el género..." />
        ) : error ? (
          <p className="genre-detail__error" role="alert">
            {error}
          </p>
        ) : genre ? (
          <>
            <header className="genre-detail__header">
              <p className="genre-detail__eyebrow">Género</p>
              <h1 className="genre-detail__title">{genre.name}</h1>
              <p className="genre-detail__count">
                {publicAlbums.length === 1
                  ? '1 álbum en el catálogo'
                  : `${publicAlbums.length} álbumes en el catálogo`}
              </p>
            </header>

            <div className="genre-detail__body">
              <section className="genre-detail__results">
                <div className="genre-detail__toolbar">
                  <h2 className="genre-detail__results-title">
                    {visibleAlbums.length === publicAlbums.length
                      ? 'Todos los álbumes'
                      : `${visibleAlbums.length} de ${publicAlbums.length} álbumes`}
                  </h2>

                  <div
                    className="genre-detail__views"
                    role="group"
                    aria-label="Forma de ver los álbumes"
                  >
                    <button
                      type="button"
                      className={`genre-detail__view-btn ${
                        view === 'grid' ? 'genre-detail__view-btn--active' : ''
                      }`}
                      aria-pressed={view === 'grid'}
                      aria-label="Ver en grilla"
                      onClick={() => setView('grid')}
                    >
                      <LayoutGrid size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`genre-detail__view-btn ${
                        view === 'list' ? 'genre-detail__view-btn--active' : ''
                      }`}
                      aria-pressed={view === 'list'}
                      aria-label="Ver en lista"
                      onClick={() => setView('list')}
                    >
                      <List size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {publicAlbums.length === 0 ? (
                  <EmptyState
                    icon={<Disc3 size={22} />}
                    title={`Todavía no hay álbumes de ${genre.name}.`}
                    message="Cuando se carguen álbumes con este género, van a aparecer acá."
                  />
                ) : visibleAlbums.length === 0 ? (
                  <EmptyState
                    icon={<Disc3 size={22} />}
                    title="Ningún álbum coincide con el filtro."
                    message={
                      yearMode === 'exact'
                        ? `No hay álbumes de ${genre.name} lanzados en ${selectedYear}. Probá con "Desde ${selectedYear}".`
                        : `No hay álbumes de ${genre.name} lanzados desde ${selectedYear}.`
                    }
                  />
                ) : (
                  <GenreAlbumList albums={visibleAlbums} view={view} />
                )}
              </section>

              <GenreFilters
                genres={genres}
                currentGenreId={genre.id}
                availableYears={genre.releaseYears}
                selectedYear={selectedYear}
                yearMode={yearMode}
                onGenreChange={handleGenreChange}
                onYearChange={setSelectedYear}
                onYearModeChange={setYearMode}
              />
            </div>

            <Link to="/music" className="genre-detail__back">
              Volver a explorar música
            </Link>
          </>
        ) : null}
      </main>

      <Footer />
    </>
  );
};
