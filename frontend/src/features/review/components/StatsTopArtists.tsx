// Ranking de los artistas más reseñados del año, del 1 al 5, con la portada de
// uno de sus discos (un artista no tiene foto propia en el catálogo) y una barra
// que compara cuánto se lo reseñó contra el primero.
import { useInView } from '../../../core/hooks/useInView';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { TopArtist } from '../models/AdvancedStats';

type StatsTopArtistsProps = {
  artists: TopArtist[];
};

export const StatsTopArtists = ({ artists }: StatsTopArtistsProps) => {
  const { ref, inView } = useInView<HTMLOListElement>();
  const max = Math.max(...artists.map((artist) => artist.count), 1);

  return (
    <section className="stats-card">
      <h3 className="stats-card__title">Tus artistas más reseñados</h3>

      {artists.length === 0 ? (
        <p className="stats-card__empty">Todavía no hay artistas para rankear.</p>
      ) : (
        <ol ref={ref} className="stats-rank">
          {artists.map((artist, index) => (
            <li key={artist.id} className="stats-rank__item">
              <span className="stats-rank__position">{index + 1}</span>
              <span className="stats-rank__cover">
                <AlbumCover title={artist.name} url={artist.coverUrl} size="sm" />
              </span>
              <div className="stats-rank__body">
                <span className="stats-rank__name">{artist.name}</span>
                <span className="stats-rank__meta">
                  {artist.count} {artist.count === 1 ? 'reseña' : 'reseñas'} · ★{' '}
                  {artist.averageRating.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                </span>
                <span className="stats-rank__track" aria-hidden="true">
                  <span
                    className="stats-rank__fill"
                    style={{
                      transform: `scaleX(${inView ? artist.count / max : 0})`,
                      transitionDelay: `${index * 90}ms`,
                    }}
                  />
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
