// Buscador de la barra de navegación: encuentra álbumes, canciones y usuarios.
//
// Mientras se escribe, pide las tres búsquedas en paralelo y muestra un
// desplegable con una sección por tipo. Elegir un resultado lleva a su ficha o a
// su perfil (sin sesión, abre el registro, igual que el resto del catálogo).
//
// Vive en core porque es parte de la barra y cruza tres features; cada búsqueda
// la hace el servicio de su feature, con la misma idea con la que AuthContext usa
// los servicios de user.
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { AlbumCover } from '../../features/genre/components/AlbumCover';
import type { Album } from '../../features/album/models/Album';
import { albumService } from '../../features/album/services/albumService';
import type { Song } from '../../features/song/models/Song';
import { songService } from '../../features/song/services/songService';
import { UserRow } from '../../features/user/components/UserRow';
import type { CommunityUser } from '../../features/user/models/Follow';
import { followService } from '../../features/user/services/followService';
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

export const NavbarSearch = () => {
  const panelId = useId();

  const [text, setText] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = text.trim();

  // Busca un rato después de la última tecla. Si se sigue escribiendo, el
  // temporizador anterior se cancela; si llega una respuesta vieja, se descarta.
  useEffect(() => {
    if (query === '') return;

    let isCurrent = true;
    const timer = setTimeout(() => {
      Promise.all([
        albumService.explore({ title: query, limit: RESULTS_PER_SECTION, sort: 'reviews' }),
        songService.explore({ title: query, limit: RESULTS_PER_SECTION, sort: 'reviews' }),
        followService.search(query, RESULTS_PER_SECTION),
      ])
        .then(([albums, songs, users]) => {
          if (!isCurrent) return;
          setResults({ albums, songs, users });
          setStatus('done');
        })
        .catch(() => {
          if (!isCurrent) return;
          setResults(EMPTY_RESULTS);
          setStatus('error');
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
    } else {
      setStatus('loading');
    }
  };

  /** Deja el buscador vacío y cerrado después de elegir un resultado. */
  const handleReset = () => {
    setText('');
    setResults(EMPTY_RESULTS);
    setStatus('idle');
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      e.currentTarget.blur();
    }
  };

  const totalResults = results.albums.length + results.songs.length + results.users.length;
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
              {results.albums.length > 0 && (
                <section className="navbar-search__section">
                  <h3 className="navbar-search__section-title">Álbumes</h3>
                  <ul className="navbar-search__list">
                    {results.albums.map((album) => (
                      <li key={album.id}>
                        <SearchResultRow
                          to={`/albums/${album.id}`}
                          cover={<AlbumCover title={album.title} url={album.urlCover} size="sm" />}
                          title={album.title}
                          subtitle={`${album.artistName} · ${album.yearLabel}`}
                          onNavigate={handleReset}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.songs.length > 0 && (
                <section className="navbar-search__section">
                  <h3 className="navbar-search__section-title">Canciones</h3>
                  <ul className="navbar-search__list">
                    {results.songs.map((song) => (
                      <li key={song.id}>
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
                          onNavigate={handleReset}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.users.length > 0 && (
                <section className="navbar-search__section">
                  <h3 className="navbar-search__section-title">Usuarios</h3>
                  <ul className="navbar-search__list">
                    {results.users.map((user) => (
                      <li key={user.id}>
                        <UserRow
                          user={user}
                          meta={`${user.reviewsLabel} · ${user.followersLabel}`}
                          onNavigate={handleReset}
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
