// Tracklist de la ficha de un álbum: una fila por pista, con su número, su
// título, el artista, su duración y su propia calificación promedio.
//
// Cada canción se califica por separado del álbum (por eso REVIEW apunta a un
// álbum O a una canción), así que la estrella de la fila NO es la del álbum. Por
// el mismo motivo cada fila es un enlace a la ficha de esa canción (/songs/:id),
// que es donde se leen sus reseñas.
//
// Es presentacional: recibe las pistas ya cargadas dentro del álbum y no llama a
// la API.
import { Link } from 'react-router-dom';
import { ChevronRight, Music } from 'lucide-react';
import { EmptyState } from '../../../core/components/EmptyState';
import { AlbumRating } from './AlbumRating';
import type { AlbumSong } from '../models/Album';
import '../styles/_album.scss';

type AlbumTracklistProps = {
  songs: AlbumSong[];
  /**
   * Artista del álbum. Se repite debajo de cada título porque una pista no tiene
   * artista propio: es el del disco, y verlo en la fila es lo que hace que el
   * tracklist se lea igual que en cualquier reproductor.
   */
  artistName: string;
};

export const AlbumTracklist = ({ songs, artistName }: AlbumTracklistProps) => {
  if (songs.length === 0) {
    return (
      <EmptyState
        icon={<Music size={22} />}
        title="Este álbum todavía no tiene canciones cargadas."
        message="Cuando se carguen sus pistas, van a listarse acá con su duración y su calificación."
      />
    );
  }

  return (
    // El <ol> ya numera solo, pero el número de pista es un dato del álbum (puede
    // empezar en otro número si falta una pista), así que se dibuja a mano.
    <ol className="tracklist">
      {songs.map((song) => (
        <li key={song.id} className="tracklist__item">
          <Link to={`/songs/${song.id}`} className="tracklist__row">
            <span className="tracklist__number">{song.numberTrack}</span>

            <span className="tracklist__main">
              <span className="tracklist__title">{song.title}</span>
              <span className="tracklist__artist">{artistName}</span>
            </span>

            <span className="tracklist__duration">{song.durationLabel}</span>

            <AlbumRating value={song.averageRating} count={song.reviewsCount} />

            <ChevronRight className="tracklist__chevron" size={16} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  );
};
