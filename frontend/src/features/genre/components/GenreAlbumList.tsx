// Los álbumes de un género, en vista de lista o de grilla, mostrados de a tandas
// con un botón "Ver más".
//
// Recibe los álbumes ya filtrados: quién filtra y cuál vista está activa lo
// maneja GenreDetailPage. Lo único propio que guarda es cuántos se están
// mostrando, porque eso depende de la vista y del ancho de la pantalla, que son
// asunto de este componente.
//
// Las dos vistas muestran los mismos datos y cambian solo el CSS, así que
// comparten el mismo bloque de JSX salvo el orden de los elementos.
import { useEffect, useState } from 'react';
import { ArrowUp, Star } from 'lucide-react';
import { AlbumCover } from './AlbumCover';
import type { GenreAlbum } from '../models/Genre';
import '../styles/_genre.scss';

export type AlbumView = 'list' | 'grid';

/** Filas que se muestran de entrada en la grilla, y cuántas suma cada "Ver más". */
const GRID_ROWS_PER_PAGE = 3;

/**
 * Álbumes por tanda en la vista de lista. Ahí cada álbum es una fila, así que no
 * se cuenta por filas: 12 es lo que muestra la grilla en escritorio (3 filas de
 * 4), y usar el mismo número hace que al alternar entre las dos vistas se vea
 * siempre la misma tanda.
 */
const LIST_PAGE_SIZE = 12;

/**
 * Cuántas columnas tiene la grilla en el ancho actual.
 *
 * ATENCIÓN: estos números son los mismos que los de `.album-collection--grid` en
 * _genre.scss y sus breakpoints ($bp-sm y $bp-lg). Si allá cambia la cantidad de
 * columnas, acá también hay que cambiarla: es la única forma de saber desde
 * JavaScript cuántos álbumes entran en una fila.
 */
function getGridColumns(): number {
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 576) return 3;
  return 2;
}

/**
 * Lleva la vista al principio de la página.
 *
 * Se lo pide a los tres elementos y no solo a `window` porque en este proyecto el
 * que scrollea NO es la ventana: en base/_reset.scss el <body> tiene
 * `height: 100%` y `overflow-x: hidden`, y esa combinación le resuelve el eje
 * vertical a `auto`, así que el <body> termina siendo su propio contenedor con
 * scroll. Un `window.scrollTo()` solo no movería nada.
 *
 * Es el mismo motivo por el que App.tsx resetea el scroll de los tres al cambiar
 * de ruta.
 */
function scrollToTop(): void {
  const options: ScrollToOptions = { top: 0, behavior: 'smooth' };

  window.scrollTo(options);
  document.documentElement.scrollTo(options);
  document.body.scrollTo(options);
}

/**
 * Sigue la cantidad de columnas de la grilla mientras se redimensiona la ventana.
 * Es lo que permite que "tres filas" sean tres filas de verdad en cualquier
 * pantalla, y no un número fijo de álbumes.
 */
function useGridColumns(): number {
  const [columns, setColumns] = useState(getGridColumns);

  useEffect(() => {
    const handleResize = () => setColumns(getGridColumns());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
}

type GenreAlbumListProps = {
  albums: GenreAlbum[];
  view: AlbumView;
};

/**
 * Calificación del álbum. Mientras nadie lo haya reseñado el promedio es 0, y en
 * ese caso se dice "Sin reseñas" en vez de mostrar "0 / 5", que parece un error.
 *
 * El número sale de `average_rating`, que recalcula el CRUD de reseñas: cuando
 * esa feature exista, esto se llena solo sin tocar nada de acá.
 */
const AlbumRating = ({ album }: { album: GenreAlbum }) => {
  if (!album.hasRating) {
    return <span className="album-rating album-rating--empty">Sin reseñas</span>;
  }

  return (
    <span className="album-rating">
      <Star className="album-rating__star" size={16} aria-hidden="true" />
      <strong className="album-rating__value">{album.ratingLabel}</strong>
      <span className="album-rating__max">/ 5</span>
    </span>
  );
};

export const GenreAlbumList = ({ albums, view }: GenreAlbumListProps) => {
  const columns = useGridColumns();

  // En la grilla la tanda son tres filas completas, así que depende de cuántas
  // columnas entren; en la lista es un número fijo.
  const pageSize = view === 'grid' ? columns * GRID_ROWS_PER_PAGE : LIST_PAGE_SIZE;

  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Se vuelve a la primera tanda cuando cambia la vista, cuando cambia el filtro
  // (llega otro array de álbumes) o cuando la ventana cruza un breakpoint y la
  // grilla pasa a tener otra cantidad de columnas: en los tres casos el "Ver más"
  // anterior ya no aplica al listado que se está mirando.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, albums]);

  const visibleAlbums = albums.slice(0, visibleCount);
  const hasMore = albums.length > visibleCount;

  // Con álbumes por traer se dice cuántos se están viendo; una vez que están
  // todos, ese "de N" ya no aporta y alcanza con el total.
  const countLabel = hasMore
    ? `Mostrando ${visibleAlbums.length} de ${albums.length} álbumes.`
    : albums.length === 1
      ? '1 álbum.'
      : `${albums.length} álbumes.`;

  return (
    <>
      <ul className={`album-collection album-collection--${view}`}>
        {visibleAlbums.map((album) => (
          <li key={album.id} className="album-item">
            <AlbumCover
              title={album.title}
              url={album.urlCover}
              size={view === 'grid' ? 'lg' : 'sm'}
            />

            <div className="album-item__info">
              <p className="album-item__title">{album.title}</p>
              <p className="album-item__artist">{album.artistName}</p>
              {/* El año solo aparece en la lista: en la grilla las tarjetas ya
                  quedan altas con la carátula, el título y el artista. */}
              {view === 'list' && album.releaseYear !== null && (
                <p className="album-item__year">{album.releaseYear}</p>
              )}
            </div>

            <AlbumRating album={album} />
          </li>
        ))}
      </ul>

      {/* El pie se muestra siempre que haya álbumes. "Ver más" solo aparece si
          quedan por traer, pero "Volver arriba" está siempre: es justo cuando ya
          se desplegaron todos que la página queda más larga y más falta hace. */}
      {albums.length > 0 && (
        <div className="album-more">
          <p className="album-more__count">{countLabel}</p>

          <div className="album-more__actions">
            {hasMore && (
              <button
                type="button"
                className="album-more__btn"
                onClick={() => setVisibleCount((current) => current + pageSize)}
              >
                Ver más álbumes
              </button>
            )}

            <button type="button" className="album-more__btn album-more__btn--ghost" onClick={scrollToTop}>
              <ArrowUp size={15} aria-hidden="true" />
              Volver arriba
            </button>
          </div>
        </div>
      )}
    </>
  );
};
