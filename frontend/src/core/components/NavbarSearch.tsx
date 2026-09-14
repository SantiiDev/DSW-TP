// Buscador de la barra de navegación: encuentra álbumes, canciones y usuarios.
//
// Mientras se escribe, pide las tres búsquedas en paralelo y muestra un
// desplegable con una sección por tipo. Elegir un resultado lleva a su ficha o a
// su perfil (sin sesión, abre el registro, igual que el resto del catálogo).
//
// Vive en core porque es parte de la barra y cruza tres features; cada búsqueda
// la hace el servicio de su feature, con la misma idea con la que AuthContext usa
// los servicios de user.
//
// Se maneja entero con el teclado, como cualquier buscador: flechas para moverse
// entre todos los resultados, Enter para abrir el resaltado y Escape para cerrar.
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { AlbumCover } from '../../features/genre/components/AlbumCover';
import type { Album } from '../../features/album/models/Album';
import { albumService } from '../../features/album/services/albumService';
import type { Song } from '../../features/song/models/Song';
import { songService } from '../../features/song/services/songService';
import { UserRow } from '../../features/user/components/UserRow';
import type { CommunityUser } from '../../features/user/models/Follow';
import { followService } from '../../features/user/services/followService';
import { useGatedNavigation } from '../hooks/useGatedNavigation';
import { SearchResultRow } from './SearchResultRow';
import './_navbar-search.scss';

/** Cuántos resultados entran por sección. Con tres secciones, el desplegable no se hace eterno. */
const RESULTS_PER_SECTION = 4;

/**
 * Cuánto se espera desde la última tecla antes de buscar. Sin esta pausa, escribir
 * "nevermind" dispararía nueve tandas de requests, una por letra, y solo importa la última.
 */
const DEBOUNCE_MS = 300;

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

type SearchResults = {
  albums: Album[];
  songs: Song[];
  users: CommunityUser[];
};

const EMPTY_RESULTS: SearchResults = { albums: [], songs: [], users: [] };

/**
 * Valor de una búsqueda que pudo haber fallado. Si falla una sola sección (por
 * ejemplo la de usuarios), las otras dos se muestran igual en vez de tirar todo.
 */
function valueOrEmpty<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === 'fulfilled' ? result.value : [];
}

export const NavbarSearch = () => {
  const { goOrSignup } = useGatedNavigation();
  const panelId = useId();

  const [text, setText] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  // Posición del resultado resaltado en la lista completa (álbumes, canciones y
  // usuarios, en ese orden), o -1 si ninguno.
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = text.trim();

  // Todas las rutas en el orden en que se dibujan: es lo que recorren las flechas.
  const paths = [
    ...results.albums.map((album) => `/albums/${album.id}`),
    ...results.songs.map((song) => `/songs/${song.id}`),
    ...results.users.map((user) => user.profilePath),
  ];

  // Busca un rato después de la última tecla. Si se sigue escribiendo, el
  // temporizador anterior se cancela; si llega una respuesta vieja, se descarta.
  useEffect(() => {
    if (query === '') return;

    let isCurrent = true;
    const timer = setTimeout(() => {
      Promise.allSettled([
        albumService.explore({ title: query, limit: RESULTS_PER_SECTION, sort: 'reviews' }),
        songService.explore({ title: query, limit: RESULTS_PER_SECTION, sort: 'reviews' }),
        followService.search(query, RESULTS_PER_SECTION),
      ]).then(([albums, songs, users]) => {
        if (!isCurrent) return;

        // Solo es un error si fallaron las tres: con una que responda hay algo que mostrar.
        if ([albums, songs, users].every((result) => result.status === 'rejected')) {
          setResults(EMPTY_RESULTS);
          setStatus('error');
          return;
        }

        const next = {
          albums: valueOrEmpty(albums),
          songs: valueOrEmpty(songs),
          users: valueOrEmpty(users),
        };
        const total = next.albums.length + next.songs.length + next.users.length;

        setResults(next);
        setHighlighted(total > 0 ? 0 : -1);
        setStatus('done');
      });
    }, DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Cierra el desplegable al hacer click afuera, igual que el menú del usuario.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    setIsOpen(true);

    if (next.trim() === '') {
      setResults(EMPTY_RESULTS);
      setStatus('idle');
      setHighlighted(-1);
    } else {
      setStatus('loading');
    }
  };

  /** Deja el buscador vacío y cerrado después de elegir un resultado. */
  const handleReset = () => {
    setText('');
    setResults(EMPTY_RESULTS);
    setStatus('idle');
    setHighlighted(-1);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      e.currentTarget.blur();
      return;
    }

    if (paths.length === 0) return;

    if (e.key === 'ArrowDown') {
      // preventDefault: si no, la flecha además mueve el cursor dentro del texto.
      e.preventDefault();
      setIsOpen(true);
      setHighlighted((index) => (index + 1) % paths.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((index) => (index <= 0 ? paths.length - 1 : index - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      goOrSignup(paths[highlighted]);
      handleReset();
    }
  };

  /**
   * Dibuja una sección del desplegable, o nada si no tiene resultados.
   * @param title encabezado de la sección.
   * @param offset cuántos resultados hay en las secciones de arriba, para ubicar
   *   cada fila en la lista completa que recorren las flechas.
   * @param rows filas ya armadas; cada una recibe si está resaltada.
   */
  const renderSection = (
    title: string,
    offset: number,
    rows: ((isHighlighted: boolean) => { key: string; node: ReactNode })[]
  ) => {
    if (rows.length === 0) return null;

    return (
      <section className="navbar-search__section">
        <h3 className="navbar-search__section-title">{title}</h3>
        <ul className="navbar-search__list">
          {rows.map((buildRow, index) => {
            const position = offset + index;
            const row = buildRow(position === highlighted);
            return (
              <li key={row.key} onMouseEnter={() => setHighlighted(position)}>
                {row.node}
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  const totalResults = paths.length;
  const showPanel = isOpen && query !== '';

  return (
    <div className="navbar__search navbar-search" ref={containerRef}>
      <Search className="navbar__search-icon" size={18} aria-hidden="true" />
      <input
        type="search"
        placeholder="Buscar música o usuarios..."
        className="navbar__search-input"
        value={text}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label="Buscar álbumes, canciones o usuarios"
        aria-expanded={showPanel}
        aria-controls={panelId}
        autoComplete="off"
      />

      {showPanel && (
        <div className="navbar-search__panel" id={panelId}>
          {status === 'loading' ? (
            <p className="navbar-search__message">Buscando...</p>
          ) : status === 'error' ? (
            <p className="navbar-search__message navbar-search__message--error">
              No pudimos buscar en este momento. Intentá de nuevo en unos segundos.
            </p>
          ) : totalResults === 0 ? (
            <p className="navbar-search__message">No encontramos nada con "{query}".</p>
          ) : (
            <>
              {renderSection(
                'Álbumes',
                0,
                results.albums.map((album) => (isHighlighted: boolean) => ({
                  key: `album-${album.id}`,
                  node: (
                    <SearchResultRow
                      to={`/albums/${album.id}`}
                      cover={<AlbumCover title={album.title} url={album.urlCover} size="sm" />}
                      title={album.title}
                      subtitle={`${album.artistName} · ${album.yearLabel}`}
                      isHighlighted={isHighlighted}
                      onNavigate={handleReset}
                    />
                  ),
                }))
              )}

              {renderSection(
                'Canciones',
                results.albums.length,
                results.songs.map((song) => (isHighlighted: boolean) => ({
                  key: `song-${song.id}`,
                  node: (
                    <SearchResultRow
                      to={`/songs/${song.id}`}
                      // Una canción no tiene portada propia: usa la de su álbum.
                      cover={
                        <AlbumCover
                          title={song.title}
                          url={song.album?.urlCover ?? null}
                          size="sm"
                        />
                      }
                      title={song.title}
                      subtitle={song.locationLabel}
                      isHighlighted={isHighlighted}
                      onNavigate={handleReset}
                    />
                  ),
                }))
              )}

              {renderSection(
                'Usuarios',
                results.albums.length + results.songs.length,
                results.users.map((user) => (isHighlighted: boolean) => ({
                  key: `user-${user.id}`,
                  node: (
                    <UserRow
                      user={user}
                      meta={`${user.reviewsLabel} · ${user.followersLabel}`}
                      isHighlighted={isHighlighted}
                      onNavigate={handleReset}
                      compact
                    />
                  ),
                }))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
