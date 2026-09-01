// Ficha técnica de un álbum: el resumen de su calificación y los pares "dato /
// valor" que no entran en la cabecera.
//
// Es presentacional: recibe el álbum ya cargado y no llama a la API.
//
// Va en la columna lateral, igual que la ficha técnica de una canción, y por el
// mismo motivo se dibuja con una <dl>: es literalmente una lista de términos con
// su descripción, y así pasa a una sola columna en mobile sin romperse.
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StarRating } from '../../review/components/StarRating';
import type { Album } from '../models/Album';
import '../styles/_album.scss';

type AlbumInfoPanelProps = {
  album: Album;
};

/** Un dato de la ficha. El valor puede ser texto o un enlace. */
type InfoItem = {
  label: string;
  value: ReactNode;
};

export const AlbumInfoPanel = ({ album }: AlbumInfoPanelProps) => {
  const items: InfoItem[] = [
    { label: 'Artista', value: album.artistName },
    { label: 'Año de lanzamiento', value: album.yearLabel },
    { label: 'Duración', value: album.runtimeLabel ?? '—' },
    { label: 'Canciones', value: album.songsCount },
    {
      // Los géneros van como enlaces y no como texto plano: desde acá se sigue
      // explorando el catálogo por estilo.
      label: album.genres.length === 1 ? 'Género' : 'Géneros',
      value:
        album.genres.length === 0 ? (
          'Sin género asignado'
        ) : (
          <span className="album-info__genres">
            {album.genres.map((genre) => (
              <Link key={genre.id} to={`/genres/${genre.id}`} className="album-info__link">
                {genre.name}
              </Link>
            ))}
          </span>
        ),
    },
    { label: 'Agregado por', value: album.creatorName },
  ];

  return (
    <section className="album-info">
      <h2 className="album-info__title">Información</h2>

      <div className="album-info__box">
        {/* Resumen de la calificación: el promedio grande con sus estrellas.
            Mientras nadie lo haya reseñado se dice así, en vez de mostrar un
            "0.0" que se leería como la peor nota posible. */}
        <div className="album-info__rating">
          {album.hasRating ? (
            <>
              <p className="album-info__average">
                {album.ratingLabel}
                <span className="album-info__max">/ 5</span>
              </p>
              <StarRating value={album.averageRating} size={18} />
              <p className="album-info__count">
                {album.reviewsCount === 1 ? '1 reseña' : `${album.reviewsCount} reseñas`}
              </p>
            </>
          ) : (
            <p className="album-info__count">Todavía nadie lo calificó.</p>
          )}
        </div>

        <dl className="album-info__list">
          {items.map((item) => (
            <div key={item.label} className="album-info__row">
              <dt className="album-info__label">{item.label}</dt>
              <dd className="album-info__value">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
