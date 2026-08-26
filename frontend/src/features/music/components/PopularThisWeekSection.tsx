// Sección de la página de exploración musical que destaca lo más escuchado de la semana.
import { Star, Flame } from 'lucide-react';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useAuthModal } from '../../../core/context/AuthModalContext';

const POPULAR_ALBUMS = [
  { id: 1, title: 'The Dark Side of the Moon', artist: 'Pink Floyd', rating: 4.5, listeners: 84521, cover: 'https://placehold.co/300x300/0a0a23/00d2d3?text=DSOTM' },
  { id: 2, title: 'Abbey Road', artist: 'The Beatles', rating: 4.4, listeners: 76432, cover: 'https://placehold.co/300x300/1b1b2f/feca57?text=AR' },
  { id: 3, title: 'Rumours', artist: 'Fleetwood Mac', rating: 4.3, listeners: 65312, cover: 'https://placehold.co/300x300/341f97/5f27cd?text=Rum' },
  { id: 4, title: 'Channel Orange', artist: 'Frank Ocean', rating: 4.4, listeners: 54203, cover: 'https://placehold.co/300x300/ee5a24/fad390?text=CO' },
  { id: 5, title: 'Wish You Were Here', artist: 'Pink Floyd', rating: 4.4, listeners: 61234, cover: 'https://placehold.co/300x300/0c2461/45aaf2?text=WYWH' },
];

const POPULAR_SONGS = [
  { id: 1, title: 'Comfortably Numb', artist: 'Pink Floyd', rating: 4.7, listeners: 94521, cover: 'https://placehold.co/300x300/0a0a23/00d2d3?text=CN' },
  { id: 2, title: 'Let It Be', artist: 'The Beatles', rating: 4.5, listeners: 81432, cover: 'https://placehold.co/300x300/1b1b2f/feca57?text=LiB' },
  { id: 3, title: 'Dreams', artist: 'Fleetwood Mac', rating: 4.4, listeners: 72312, cover: 'https://placehold.co/300x300/341f97/5f27cd?text=Dreams' },
  { id: 4, title: 'Pyramids', artist: 'Frank Ocean', rating: 4.5, listeners: 58203, cover: 'https://placehold.co/300x300/ee5a24/fad390?text=Pyr' },
  { id: 5, title: 'Devil in a New Dress', artist: 'Kanye West', rating: 4.6, listeners: 65143, cover: 'https://placehold.co/300x300/b71540/fc5c65?text=DiND' },
];

type PopularThisWeekSectionProps = {
  type: 'albums' | 'canciones';
};

export const PopularThisWeekSection = ({ type }: PopularThisWeekSectionProps) => {
  const items = type === 'albums' ? POPULAR_ALBUMS : POPULAR_SONGS;
  const { openSignup } = useAuthModal();

  return (
    <section className="explore-section">
      <SectionHeader
        icon={<Flame size={22} />}
        title="Populares Esta Semana"
        iconTone="fire"
        actionLabel="Ver todos"
        onAction={openSignup}
      />

      <div className="explore-section__grid explore-section__grid--3col">
        {items.map((item) => (
          <div key={item.id} className="music-card music-card--wide" onClick={openSignup} style={{ cursor: 'pointer' }}>
            <div className="music-card__cover">
              <img src={item.cover} alt={item.title} loading="lazy" />
              <div className="music-card__overlay">
                <div className="music-card__rating">
                  <Star size={14} fill="currentColor" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="music-card__info">
              <h3 className="music-card__title">{item.title}</h3>
              <p className="music-card__artist">{item.artist}</p>
              <p className="music-card__reviews">{item.listeners.toLocaleString()} oyentes</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
