// Buscador para agregar álbumes a una lista, con resultados en vivo.
//
// Busca por título contra el catálogo aprobado con el servicio de álbumes que ya
// existe, igual que el buscador de la barra de navegación, en vez de traer todo
// el catálogo para filtrarlo en el cliente.
//
// NO usa el SearchBar de core/components, y no es un descuido: ese componente es
// un <form>, y este buscador se dibuja adentro del <form> de ListForm. Un
// formulario dentro de otro es HTML inválido, y el resultado era que el botón
// "Buscar" enviaba el formulario de AFUERA: la página se recargaba entera y se
// perdía la lista a medio armar.
//
// Sin el submit tampoco hace falta un botón de buscar: los resultados aparecen
// solos mientras se escribe, con una pausa para no disparar una request por tecla.
import { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { Loader } from '../../../core/components/Loader';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { albumService } from '../../album/services/albumService';
import type { Album } from '../../album/models/Album';
import { AlbumCover } from '../../genre/components/AlbumCover';
import '../styles/_list.scss';

/** Cuántos resultados trae cada búsqueda: alcanza para elegir sin scrollear demasiado. */
const RESULT_LIMIT = 8;

/**
 * Cuánto se espera después de la última tecla antes de preguntarle a la API.
 * Sin esta pausa, escribir "nevermind" saldría a buscar nueve veces.
 */
const SEARCH_DELAY_MS = 350;

type ListAlbumPickerProps = {
  /** Ids de los álbumes que ya están en la lista, para no ofrecerlos de nuevo. */
  excludeIds: number[];
  /** true mientras se está agregando un álbum: deshabilita los botones de la lista. */
  isBusy: boolean;
  /**
   * Avisa qué álbum se eligió. Va el álbum entero y no solo su id porque los
   * dos usos lo necesitan: la ficha de la lista manda el id a la API, y el
   * formulario de alta tiene que dibujar el elegido antes de que exista la lista.
   */
  onAdd: (album: Album) => void;
};

export const ListAlbumPicker = ({ excludeIds, isBusy, onAdd }: ListAlbumPickerProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca cada vez que cambia el texto, después de la pausa. Es sincronizar el
  // componente con la API, que es para lo que sirve un efecto.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Si el usuario sigue escribiendo, la limpieza cancela esta tanda antes de
    // que salga. `cancelled` cubre el otro caso: la request ya salió y la
    // respuesta llega tarde, cuando el texto buscado ya es otro. Sin esa
    // bandera, una búsqueda vieja podría pisar los resultados de la nueva.
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const albums = await albumService.explore({ title: trimmed, limit: RESULT_LIMIT });
        if (cancelled) return;

        setResults(albums);
        setError(null);
      } catch (err) {
        if (cancelled) return;

        setError(getErrorMessage(err));
        setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const visibleResults = results.filter((album) => !excludeIds.includes(album.id));
  const hasQuery = query.trim() !== '';

  return (
    <div className="list-album-picker">
      <div className="list-album-picker__field">
        <Search className="list-album-picker__icon" size={16} aria-hidden="true" />

        {/* type="text" y no type="search": el segundo trae la cruz de limpiar
            propia del navegador, que no se puede estilar y desentona con el
            resto del sitio. La de al lado es la nuestra. */}
        <input
          type="text"
          className="list-album-picker__input"
          placeholder="Buscar un álbum por título..."
          aria-label="Buscar un álbum por título"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Este campo vive dentro del formulario de alta de la lista, y un
          // <input> suelto hace que Enter envíe ese formulario. Como los
          // resultados salen solos mientras se escribe, Enter no tiene nada que
          // hacer acá.
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        />

        {hasQuery && (
          <button
            type="button"
            className="list-album-picker__clear"
            aria-label="Limpiar la búsqueda"
            title="Limpiar la búsqueda"
            onClick={() => setQuery('')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {isSearching ? (
        <Loader message="Buscando..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : hasQuery && visibleResults.length === 0 ? (
        <p className="list-album-picker__empty">
          No encontramos álbumes con ese título, o ya están todos en la lista.
        </p>
      ) : (
        visibleResults.length > 0 && (
          <ul className="list-album-picker__results">
            {visibleResults.map((album) => (
              <li key={album.id} className="list-album-picker__result">
                <AlbumCover title={album.title} url={album.urlCover} size="sm" />
                <div className="list-album-picker__result-info">
                  <p className="list-album-picker__result-title">{album.title}</p>
                  <p className="list-album-picker__result-artist">{album.artistName}</p>
                </div>
                <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAdd(album)}>
                  <Plus size={14} aria-hidden="true" />
                  Agregar
                </Button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};
