// Las pistas del álbum al que pertenece la canción, en la columna lateral de su
// ficha, con la que se está viendo resaltada.
//
// Es lo que da contexto: una canción se entiende dentro de su disco, y desde acá
// se puede saltar a cualquier otra pista sin volver al álbum y entrar de nuevo.
//
// Es presentacional: las pistas las pide la página (una sola vez, porque también
// las usa la navegación anterior/siguiente) y acá solo se dibujan.
import { Link } from 'react-router-dom';
import { Loader } from '../../../core/components/Loader';
import type { Song } from '../models/Song';
import '../styles/_song.scss';

type SongAlbumTracklistProps = {
  /** Tracklist completo del álbum, ordenado por número de pista. */
  tracks: Song[];
  /** La canción que se está viendo: es la que se resalta y no lleva enlace. */
  currentSongId: number;
  albumId: number;
  isLoading: boolean;
  /** Mensaje de error de la carga, o null si salió bien. */
  error: string | null;
};

export const SongAlbumTracklist = ({
  tracks,
  currentSongId,
  albumId,
  isLoading,
  error,
}: SongAlbumTracklistProps) => {
  return (
    <section className="song-tracklist">
      <header className="song-tracklist__head">
        <h2 className="song-tracklist__title">Canciones del álbum</h2>

        <Link to={`/albums/${albumId}`} className="song-tracklist__see-all">
          Ver álbum
        </Link>
      </header>

      {isLoading ? (
        <Loader message="Cargando el tracklist..." />
      ) : error ? (
        // Es un bloque secundario: si falla, se avisa en gris y la ficha sigue
        // siendo perfectamente usable. Un Alert rojo acá asustaría de más.
        <p className="song-tracklist__note">No pudimos traer las otras pistas del álbum.</p>
      ) : tracks.length === 0 ? (
        <p className="song-tracklist__note">Este álbum todavía no tiene su tracklist cargado.</p>
      ) : (
        <ol className="song-tracklist__list">
          {tracks.map((track) => {
            const isCurrent = track.id === currentSongId;

            const content = (
              <>
                <span className="song-tracklist__number">{track.numberTrack}</span>
                <span className="song-tracklist__name">{track.title}</span>
                <span className="song-tracklist__duration">{track.durationLabel}</span>
              </>
            );

            return (
              <li key={track.id} className="song-tracklist__item">
                {/* La pista actual no es un enlace a sí misma: se dibuja como
                    texto resaltado y aria-current le dice al lector de pantalla
                    dónde está parado. */}
                {isCurrent ? (
                  <span
                    className="song-tracklist__row song-tracklist__row--current"
                    aria-current="true"
                  >
                    {content}
                  </span>
                ) : (
                  <Link to={`/songs/${track.id}`} className="song-tracklist__row">
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
