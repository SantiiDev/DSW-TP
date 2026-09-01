// Cabecera de la ficha de un álbum: la portada a la izquierda, los datos del
// disco al lado y, a la derecha, los contadores con el botón para calificarlo.
//
// Es presentacional: recibe el álbum ya cargado y no llama a la API. Lo único
// que decide es qué dice el botón, según el usuario ya lo haya calificado o no.
//
// El fondo se dibuja con la portada ampliada y desenfocada porque es la única
// imagen que tiene un álbum en Musicboxd: no hay foto de artista en el catálogo
// (ver el seed), así que la carátula hace de las dos cosas.
//
// La cabecera está en fila y no centrada porque tiene tres bloques con pesos
// distintos: la portada identifica el disco, el medio lo nombra y la derecha es
// para actuar. Centrado, el botón terminaba a media pantalla del título.
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import { StatsBar } from '../../../core/components/StatsBar';
import type { Stat } from '../../../core/components/StatsBar';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { Album } from '../models/Album';
import '../styles/_album.scss';

type AlbumHeroProps = {
  album: Album;
  /** Lo que puntuó el usuario, o null si todavía no reseñó este álbum. */
  myRating: number | null;
  /** Lleva al formulario de reseña, que vive en la sección de reseñas. */
  onRate: () => void;
};

/** Una calificación con su estrella, como se muestra en los contadores. */
const ratingValue = (value: number) => (
  <>
    <Star size={15} aria-hidden="true" />
    {value.toFixed(1)}
  </>
);

export const AlbumHero = ({ album, myRating, onRate }: AlbumHeroProps) => {
  // La línea de datos saltea lo que el álbum no tiene: sin duración cargada
  // quedaría un separador suelto ("1973 · 12 canciones · ").
  const metaParts = [album.yearLabel, album.songsLabel, album.runtimeLabel].filter(Boolean);

  const stats: Stat[] = [
    { value: album.reviewsCount, label: 'Reseñas' },
    {
      // Sin reseñas se muestra un guión y no un "0", que se leería como la peor
      // calificación posible en vez de "todavía nadie lo calificó".
      value: album.hasRating ? ratingValue(album.averageRating) : '—',
      unit: album.hasRating ? '/ 5' : undefined,
      label: 'Promedio',
    },
    {
      value: myRating === null ? '—' : ratingValue(myRating),
      unit: myRating === null ? undefined : '/ 5',
      label: 'Tu nota',
    },
  ];

  return (
    <header className="album-hero">
      {album.urlCover && (
        <div
          className="album-hero__backdrop"
          style={{ backgroundImage: `url(${album.urlCover})` }}
          aria-hidden="true"
        />
      )}

      <div className="album-hero__content">
        <div className="album-hero__cover">
          <AlbumCover title={album.title} url={album.urlCover} size="lg" />
        </div>

        <div className="album-hero__info">
          <p className="album-hero__eyebrow">Álbum</p>
          <h1 className="album-hero__title">{album.title}</h1>
          <p className="album-hero__artist">{album.artistName}</p>
          <p className="album-hero__meta">{metaParts.join(' · ')}</p>

          {/* Cada género lleva a su ficha, que es de donde salen los álbumes de
              ese estilo: es el único enlace de la cabecera, porque el artista
              todavía no tiene pantalla propia. */}
          {album.genres.length > 0 && (
            <ul className="album-hero__genres">
              {album.genres.map((genre) => (
                <li key={genre.id}>
                  <Link to={`/genres/${genre.id}`} className="album-hero__genre">
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="album-hero__aside">
          <StatsBar items={stats} />

          <Button variant="primary" size="lg" fullWidth onClick={onRate}>
            <Star size={18} aria-hidden="true" />
            {myRating === null ? 'Calificar álbum' : 'Editar mi calificación'}
          </Button>
        </div>
      </div>
    </header>
  );
};
