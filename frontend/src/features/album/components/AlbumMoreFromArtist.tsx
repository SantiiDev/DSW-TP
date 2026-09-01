// Otros álbumes del mismo artista, al pie de la ficha de un álbum.
//
// Es la salida natural de la pantalla: quien entró a un disco de un artista suele
// querer ver el resto de su discografía, y hoy la única forma de llegar a ella es
// volver al explorador y buscarla a mano.
//
// Se dibuja como una grilla de portadas y no como una lista de filas porque va en
// la columna ancha de la ficha: son discos, y a un disco lo identifica su tapa.
//
// Pide el listado del catálogo filtrado por artista (GET /albums?id_artist=), que
// exige token; la ruta de la ficha ya lo pide (ver App.tsx), así que acá siempre
// hay sesión.
import { Link } from 'react-router-dom';
import { Loader } from '../../../core/components/Loader';
import { useFetch } from '../../../core/hooks/useFetch';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { albumService } from '../services/albumService';
import '../styles/_album.scss';

type AlbumMoreFromArtistProps = {
  artistId: number;
  artistName: string;
  /** El álbum que se está viendo: se saca de la lista para no ofrecerlo de nuevo. */
  currentAlbumId: number;
};

/** Cuántos álbumes se muestran como mucho. Es una sugerencia, no un listado. */
const MAX_ALBUMS = 6;

export const AlbumMoreFromArtist = ({
  artistId,
  artistName,
  currentAlbumId,
}: AlbumMoreFromArtistProps) => {
  const { data, isLoading, error } = useFetch(
    () => albumService.list({ idArtist: artistId }),
    artistId
  );

  const albums = (data ?? []).filter((album) => album.id !== currentAlbumId).slice(0, MAX_ALBUMS);

  return (
    <section className="more-from" id="discografia">
      <header className="album-detail__section-head">
        <h2 className="album-detail__section-title">Más de {artistName}</h2>
      </header>

      {isLoading ? (
        <Loader message="Buscando más álbumes..." />
      ) : error ? (
        // Es un bloque secundario: si falla, se avisa en gris y la ficha sigue
        // siendo perfectamente usable. Un Alert rojo acá asustaría de más.
        <p className="more-from__note">No pudimos traer el resto de la discografía.</p>
      ) : albums.length === 0 ? (
        <p className="more-from__note">
          Todavía no hay otros álbumes de {artistName} en el catálogo.
        </p>
      ) : (
        <ul className="more-from__grid">
          {albums.map((album) => (
            <li key={album.id}>
              <Link to={`/albums/${album.id}`} className="more-from__card">
                <AlbumCover title={album.title} url={album.urlCover} size="lg" />

                <span className="more-from__name">{album.title}</span>
                <span className="more-from__meta">
                  {album.yearLabel} · {album.songsLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
