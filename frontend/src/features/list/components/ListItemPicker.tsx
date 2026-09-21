// Buscador para agregar ítems a una lista, con resultados en vivo. Busca álbumes
// o canciones según de qué sea la lista.
//
// Busca por título contra el catálogo aprobado con los servicios que ya existen
// (los mismos que usa el buscador de la barra de navegación), en vez de traer
// todo el catálogo para filtrarlo en el cliente.
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
import { songService } from '../../song/services/songService';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { ListType } from '../models/List';
import '../styles/_list.scss';

/** Cuántos resultados trae cada búsqueda: alcanza para elegir sin scrollear demasiado. */
const RESULT_LIMIT = 8;

/**
 * Cuánto se espera después de la última tecla antes de preguntarle a la API.
 * Sin esta pausa, escribir "nevermind" saldría a buscar nueve veces.
 */
const SEARCH_DELAY_MS = 350;

/**
 * Un resultado del buscador, ya sea un álbum o una canción.
 *
 * Se define esta forma común en vez de manejar los modelos Album y Song por
 * separado porque el buscador dibuja las dos cosas igual: portada, título y
 * artista debajo. Una canción no tiene portada propia, así que usa la de su
 * álbum.
 */
export type PickedItem = {
  id: number;
  title: string;
  urlCover: string | null;
  artistName: string;
};

/** Los textos que cambian según de qué sea la lista. */
const COPY: Record<ListType, { placeholder: string; empty: string }> = {
  album: {
    placeholder: 'Buscar un álbum por título...',
    empty: 'No encontramos álbumes con ese título, o ya están todos en la lista.',
  },
  song: {
    placeholder: 'Buscar una canción por título...',
    empty: 'No encontramos canciones con ese título, o ya están todas en la lista.',
  },
};

/**
 * Busca en el catálogo aprobado y devuelve los resultados ya en la forma común.
 * @param type de qué es la lista: decide a qué servicio se le pregunta.
 * @param title texto a buscar, ya sin espacios sobrantes.
 */
async function search(type: ListType, title: string): Promise<PickedItem[]> {
  if (type === 'album') {
    const albums = await albumService.explore({ title, limit: RESULT_LIMIT });
    return albums.map((album) => ({
      id: album.id,
      title: album.title,
      urlCover: album.urlCover,
      artistName: album.artistName,
    }));
  }

  const songs = await songService.explore({ title, limit: RESULT_LIMIT });
  return songs.map((song) => ({
    id: song.id,
    title: song.title,
    urlCover: song.album?.urlCover ?? null,
    artistName: song.artistName,
  }));
}

type ListItemPickerProps = {
  /** De qué es la lista: decide si se buscan álbumes o canciones. */
  type: ListType;
  /** Ids de los ítems que ya están en la lista, para no ofrecerlos de nuevo. */
  excludeIds: number[];
  /** true mientras se está agregando un ítem: deshabilita los botones de la lista. */
  isBusy: boolean;
  /**
   * Avisa qué ítem se eligió. Va el ítem entero y no solo su id porque los dos
   * usos lo necesitan: la ficha de la lista manda el id a la API, y el
   * formulario de alta tiene que dibujar el elegido antes de que exista la lista.
   */
  onAdd: (item: PickedItem) => void;
};

export const ListItemPicker = ({ type, excludeIds, isBusy, onAdd }: ListItemPickerProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca cada vez que cambia el texto (o el tipo de lista), después de la
  // pausa. Es sincronizar el componente con la API, que es para lo que sirve un
  // efecto.
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
        const items = await search(type, trimmed);
        if (cancelled) return;

        setResults(items);
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
  }, [query, type]);

  const visibleResults = results.filter((item) => !excludeIds.includes(item.id));
  const hasQuery = query.trim() !== '';

  return (
    <div className="list-item-picker">
      <div className="list-item-picker__field">
        <Search className="list-item-picker__icon" size={16} aria-hidden="true" />

        {/* type="text" y no type="search": el segundo trae la cruz de limpiar
            propia del navegador, que no se puede estilar y desentona con el
            resto del sitio. La de al lado es la nuestra. */}
        <input
          type="text"
          className="list-item-picker__input"
          placeholder={COPY[type].placeholder}
          aria-label={COPY[type].placeholder}
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
            className="list-item-picker__clear"
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
        <p className="list-item-picker__empty">{COPY[type].empty}</p>
      ) : (
        visibleResults.length > 0 && (
          <ul className="list-item-picker__results">
            {visibleResults.map((item) => (
              <li key={item.id} className="list-item-picker__result">
                <AlbumCover title={item.title} url={item.urlCover} size="sm" />
                <div className="list-item-picker__result-info">
                  <p className="list-item-picker__result-title">{item.title}</p>
                  <p className="list-item-picker__result-artist">{item.artistName}</p>
                </div>
                <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onAdd(item)}>
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
