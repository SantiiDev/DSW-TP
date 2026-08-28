// Tracklist de la ficha de un álbum: una fila por pista, con su número, su
// título, su duración y su propia calificación promedio.
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
};

export const AlbumTracklist = ({ songs }: AlbumTracklistProps) => {
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
    <ol className="tracklist">
      {songs.map((song) => (
        <li key={song.id}>
          <Link to={`/songs/${song.id}`} className="tracklist__item">
            <span className="tracklist__number">{song.numberTrack}</span>

            <span className="tracklist__title">{song.title}</span>

            <AlbumRating value={song.averageRating} count={song.reviewsCount} />

            <span className="tracklist__duration">{song.durationLabel}</span>

            <ChevronRight className="tracklist__chevron" size={16} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  );
};
