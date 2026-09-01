// Cabecera de la ficha de una canción: la carátula del álbum a la izquierda, los
// datos de la pista a la derecha y la barra de contadores debajo.
//
// Es presentacional: recibe la canción ya cargada y no llama a la API.
//
// La carátula (y el fondo desenfocado que va detrás) son las del álbum: una
// canción no tiene portada propia en el catálogo.
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { StatsBar } from '../../../core/components/StatsBar';
import type { Stat } from '../../../core/components/StatsBar';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { Song } from '../models/Song';
import '../styles/_song.scss';

type SongHeroProps = {
  song: Song;
};

export const SongHero = ({ song }: SongHeroProps) => {
  const cover = song.album?.urlCover ?? null;

  const stats: Stat[] = [
    { value: song.reviewsCount, label: 'Reseñas' },
    {
      // Sin reseñas se muestra un guión y no un "0", que se leería como la peor
      // calificación posible en vez de "todavía nadie la calificó".
      value: song.hasRating ? (
        <>
          <Star size={15} aria-hidden="true" />
          {song.ratingLabel}
        </>
      ) : (
        '—'
      ),
      unit: song.hasRating ? '/ 5' : undefined,
      label: 'Calificación',
    },
    { value: song.durationLabel, label: 'Duración' },
  ];

  return (
    <header className="song-hero">
      {cover && (
        <div
          className="song-hero__backdrop"
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden="true"
        />
      )}

      <div className="song-hero__content">
        <div className="song-hero__cover">
          <AlbumCover title={song.album?.title ?? song.title} url={cover} size="lg" />
        </div>

        <div className="song-hero__info">
          <p className="song-hero__eyebrow">Canción</p>
          <h1 className="song-hero__title">{song.title}</h1>

          <p className="song-hero__location">
            {song.album ? (
              <>
                Pista {song.numberTrack} de{' '}
                <Link to={`/albums/${song.album.id}`} className="song-hero__album-link">
                  {song.album.title}
                </Link>
              </>
            ) : (
              // Las canciones sin álbum son filas viejas: la API ya no deja
              // cargar ninguna.
              'Canción suelta, sin álbum'
            )}
          </p>

          <p className="song-hero__artist">{song.artistName}</p>

          <StatsBar items={stats} />
        </div>
      </div>
    </header>
  );
};
