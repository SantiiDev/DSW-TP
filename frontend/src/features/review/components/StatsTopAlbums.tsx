// Los cinco álbumes mejor calificados del año, en fila de portadas con su puesto,
// como un top de fin de año. Cada portada lleva a la ficha del álbum.
import { Link } from 'react-router-dom';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { TopAlbum } from '../models/AdvancedStats';

type StatsTopAlbumsProps = {
  albums: TopAlbum[];
  /**
   * false en la vista previa bloqueada: los álbumes de muestra no existen, así que
   * no pueden llevar a ninguna ficha.
   */
  isInteractive?: boolean;
};

export const StatsTopAlbums = ({ albums, isInteractive = true }: StatsTopAlbumsProps) => {
  return (
    <section className="stats-card stats-card--wide">
      <h3 className="stats-card__title">Tus álbumes mejor calificados</h3>

      {albums.length === 0 ? (
        <p className="stats-card__empty">
          Este año calificaste canciones sueltas, pero ningún álbum entero.
        </p>
      ) : (
        <ol className="stats-albums">
          {albums.map((album, index) => {
            const content = (
              <>
                <span className="stats-albums__cover">
                  <AlbumCover title={album.title} url={album.coverUrl} size="lg" />
                  <span className="stats-albums__position">{index + 1}</span>
                </span>
                <span className="stats-albums__title">{album.title}</span>
                <span className="stats-albums__meta">
                  {album.artist ?? 'Artista desconocido'}
                </span>
                <span className="stats-albums__rating">
                  ★ {album.rating.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                </span>
              </>
            );

            return (
              <li
                key={album.id}
                className="stats-albums__item"
                // Aparecen escalonados, de izquierda a derecha.
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {isInteractive ? (
                  <Link to={`/albums/${album.id}`} className="stats-albums__link">
                    {content}
                  </Link>
                ) : (
                  <div className="stats-albums__link">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
