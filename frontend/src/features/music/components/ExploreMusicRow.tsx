// Fila numerada del explorador de música: el puesto, la portada chica, el título
// con su artista y año, y la calificación a la derecha.
//
// La usa "Mejores Calificados", que es un ranking y por eso muestra el puesto.
//
// Es un GatedLink: muestra el catálogo real a cualquiera, pero el click solo
// navega si hay sesión; si no, abre el modal de registro.
import { Star } from 'lucide-react';
import { GatedLink } from '../../../core/components/GatedLink';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { reviewsLabel } from '../models/ExploreItem';
import type { ExploreItem } from '../models/ExploreItem';

type ExploreMusicRowProps = {
  item: ExploreItem;
  /** Puesto en el ranking, empezando en 1. */
  rank: number;
};

export const ExploreMusicRow = ({ item, rank }: ExploreMusicRowProps) => {
  return (
    <GatedLink to={item.to} className="music-list-item">
      <span className="music-list-item__rank">#{rank}</span>

      <div className="music-list-item__cover">
        <AlbumCover title={item.title} url={item.cover} size="sm" />
      </div>

      <div className="music-list-item__info">
        <h3 className="music-list-item__title">{item.title}</h3>
        <p className="music-list-item__meta">
          {item.artist}
          {item.year !== null && ` · ${item.year}`}
        </p>
      </div>

      <div className="music-list-item__stats">
        {/* Igual que en la tarjeta: sin reseñas no se muestra un "0.0", que se
            leería como una calificación pésima. */}
        {item.rating > 0 && (
          <div className="music-list-item__rating">
            <Star size={14} fill="currentColor" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        )}
        <p className="music-list-item__reviews">{reviewsLabel(item.reviewsCount)}</p>
      </div>
    </GatedLink>
  );
};
