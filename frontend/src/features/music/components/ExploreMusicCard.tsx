// Tarjeta con portada del explorador de música: la carátula arriba, y debajo el
// título, el artista y la cantidad de reseñas.
//
// La usan "Tendencia Ahora", "Nuevos Lanzamientos" y "Populares Esta Semana", que
// se diferencian solo en la variante de ancho y en si llevan la cinta de "Nuevo".
//
// Es un GatedLink: muestra el catálogo real a cualquiera, pero el click solo
// navega si hay sesión; si no, abre el modal de registro.
import { Star } from 'lucide-react';
import { GatedLink } from '../../../core/components/GatedLink';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { reviewsLabel } from '../models/ExploreItem';
import type { ExploreItem } from '../models/ExploreItem';

type ExploreMusicCardProps = {
  item: ExploreItem;
  /** Variante de la tarjeta: 'new' suma la cinta de "Nuevo" en la portada. */
  variant?: 'default' | 'new';
  /**
   * Qué se muestra en la última línea. 'reviews' es la cantidad de reseñas;
   * 'year' el año de lanzamiento, que es lo que le importa a "Nuevos
   * Lanzamientos".
   */
  footer?: 'reviews' | 'year';
};

export const ExploreMusicCard = ({
  item,
  variant = 'default',
  footer = 'reviews',
}: ExploreMusicCardProps) => {
  const classes = ['music-card', variant === 'default' ? '' : `music-card--${variant}`]
    .filter(Boolean)
    .join(' ');

  return (
    <GatedLink to={item.to} className={classes}>
      <div className="music-card__cover">
        {/* AlbumCover dibuja un degradado con la inicial cuando no hay portada
            cargada o cuando la imagen no llega a cargar. */}
        <AlbumCover title={item.title} url={item.cover} size="lg" />

        {variant === 'new' && <div className="music-card__badge">Nuevo</div>}

        {/* La calificación solo se muestra si alguien ya lo reseñó: un "0.0"
            sobre la portada se lee como una nota pésima y no como "todavía nadie
            lo calificó". */}
        {item.rating > 0 && (
          <div className="music-card__overlay">
            <div className="music-card__rating">
              <Star size={14} fill="currentColor" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="music-card__info">
        <h3 className="music-card__title">{item.title}</h3>
        <p className="music-card__artist">{item.artist}</p>
        <p className="music-card__reviews">
          {footer === 'year'
            ? (item.year ?? 'Año desconocido')
            : reviewsLabel(item.reviewsCount)}
        </p>
      </div>
    </GatedLink>
  );
};
