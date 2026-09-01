// Ficha técnica de una canción: los pares "dato / valor" que no entran en la
// cabecera (álbum, artista, año, duración, número de pista y quién la propuso).
//
// Es presentacional: recibe la canción ya cargada y no llama a la API.
//
// Se dibuja con una <dl> y no con una tabla porque es exactamente eso: una lista
// de términos con su descripción. Además, así se puede pasar a una sola columna
// en mobile sin que se rompa nada.
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Song } from '../models/Song';
import '../styles/_song.scss';

type SongInfoPanelProps = {
  song: Song;
};

/** Un dato de la ficha. El valor puede ser texto o un enlace. */
type InfoItem = {
  label: string;
  value: ReactNode;
};

export const SongInfoPanel = ({ song }: SongInfoPanelProps) => {
  const items: InfoItem[] = [
    {
      label: 'Álbum',
      value: song.album ? (
        <Link to={`/albums/${song.album.id}`} className="song-info__link">
          {song.album.title}
        </Link>
      ) : (
        'Sin álbum'
      ),
    },
    { label: 'Artista', value: song.artistName },
    { label: 'Año de lanzamiento', value: song.yearLabel },
    { label: 'Duración', value: song.durationLabel },
    { label: 'Número de pista', value: song.numberTrack },
    { label: 'Agregada por', value: song.creatorName },
  ];

  return (
    <section className="song-info">
      <h2 className="song-info__title">Información</h2>

      <dl className="song-info__list">
        {items.map((item) => (
          <div key={item.label} className="song-info__row">
            <dt className="song-info__label">{item.label}</dt>
            <dd className="song-info__value">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
