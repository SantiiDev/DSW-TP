import { Star, TrendingUp, ChevronRight } from 'lucide-react';

const TRENDING_ALBUMS = [
  { id: 1, title: 'GNX', artist: 'Kendrick Lamar', rating: 4.2, reviews: 1842, cover: 'https://placehold.co/300x300/1a1a2e/e94560?text=GNX' },
  { id: 2, title: 'Brat', artist: 'Charli XCX', rating: 4.0, reviews: 2103, cover: 'https://placehold.co/300x300/0f3460/16c79a?text=Brat' },
  { id: 3, title: 'Hit Me Hard and Soft', artist: 'Billie Eilish', rating: 3.8, reviews: 1567, cover: 'https://placehold.co/300x300/2c003e/d4a5ff?text=HMHS' },
  { id: 4, title: 'The Tortured Poets Department', artist: 'Taylor Swift', rating: 3.5, reviews: 3241, cover: 'https://placehold.co/300x300/3c1642/f5a623?text=TTPD' },
  { id: 5, title: 'Cowboy Carter', artist: 'Beyoncé', rating: 4.1, reviews: 2876, cover: 'https://placehold.co/300x300/0c2461/48dbfb?text=CC' },
  { id: 6, title: 'Chromakopia', artist: 'Tyler, the Creator', rating: 4.3, reviews: 1923, cover: 'https://placehold.co/300x300/2d3436/00cec9?text=Chrom' },
];

const TRENDING_SONGS = [
  { id: 1, title: 'Not Like Us', artist: 'Kendrick Lamar', rating: 4.5, reviews: 5123, cover: 'https://placehold.co/300x300/1a1a2e/e94560?text=NLU' },
  { id: 2, title: '360', artist: 'Charli XCX', rating: 4.1, reviews: 2341, cover: 'https://placehold.co/300x300/0f3460/16c79a?text=360' },
  { id: 3, title: 'Birds of a Feather', artist: 'Billie Eilish', rating: 3.9, reviews: 1890, cover: 'https://placehold.co/300x300/2c003e/d4a5ff?text=BoaF' },
  { id: 4, title: 'Fortnight', artist: 'Taylor Swift ft. Post Malone', rating: 3.6, reviews: 2741, cover: 'https://placehold.co/300x300/3c1642/f5a623?text=Fort' },
  { id: 5, title: 'Texas Hold \'Em', artist: 'Beyoncé', rating: 4.2, reviews: 3102, cover: 'https://placehold.co/300x300/0c2461/48dbfb?text=THE' },
  { id: 6, title: 'St. Chroma', artist: 'Tyler, the Creator', rating: 4.0, reviews: 1654, cover: 'https://placehold.co/300x300/2d3436/00cec9?text=StCh' },
];

interface TrendingSectionProps {
  type: 'albums' | 'canciones';
}

export const TrendingSection = ({ type }: TrendingSectionProps) => {
  const items = type === 'albums' ? TRENDING_ALBUMS : TRENDING_SONGS;

  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <TrendingUp size={22} className="explore-section__header-icon" />
          <h2 className="explore-section__title">Tendencia Ahora</h2>
        </div>
        <button className="explore-section__see-all">
          Ver todos <ChevronRight size={16} />
        </button>
      </div>

      <div className="explore-section__grid">
        {items.map((item) => (
          <div key={item.id} className="music-card">
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
              <p className="music-card__reviews">{item.reviews.toLocaleString()} reseñas</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
