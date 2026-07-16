// Sección de la página de exploración musical que lista los álbumes mejor valorados por la comunidad.
import { Star, Award, ChevronRight } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

const TOP_ALBUMS = [
  { id: 1, rank: 1, title: 'OK Computer', artist: 'Radiohead', year: 1997, rating: 4.6, reviews: 12453, cover: 'https://placehold.co/300x300/1b1b2f/e43f5a?text=OKC' },
  { id: 2, rank: 2, title: 'In Rainbows', artist: 'Radiohead', year: 2007, rating: 4.5, reviews: 9821, cover: 'https://placehold.co/300x300/162447/e0e0e0?text=IR' },
  { id: 3, rank: 3, title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015, rating: 4.5, reviews: 11234, cover: 'https://placehold.co/300x300/1f4068/e8d21d?text=TPAB' },
  { id: 4, rank: 4, title: 'Blonde', artist: 'Frank Ocean', year: 2016, rating: 4.5, reviews: 8956, cover: 'https://placehold.co/300x300/0d7377/14ffec?text=Blonde' },
  { id: 5, rank: 5, title: 'Loveless', artist: 'My Bloody Valentine', year: 1991, rating: 4.4, reviews: 7632, cover: 'https://placehold.co/300x300/6c5b7b/c06c84?text=Loveless' },
];

const TOP_SONGS = [
  { id: 1, rank: 1, title: 'Bohemian Rhapsody', artist: 'Queen', year: 1975, rating: 4.8, reviews: 15234, cover: 'https://placehold.co/300x300/1b1b2f/e43f5a?text=BR' },
  { id: 2, rank: 2, title: 'Stairway to Heaven', artist: 'Led Zeppelin', year: 1971, rating: 4.7, reviews: 12456, cover: 'https://placehold.co/300x300/162447/e0e0e0?text=StH' },
  { id: 3, rank: 3, title: 'Runaway', artist: 'Kanye West', year: 2010, rating: 4.6, reviews: 9845, cover: 'https://placehold.co/300x300/1f4068/e8d21d?text=Run' },
  { id: 4, rank: 4, title: 'How to Disappear Completely', artist: 'Radiohead', year: 2000, rating: 4.6, reviews: 8234, cover: 'https://placehold.co/300x300/0d7377/14ffec?text=HtDC' },
  { id: 5, rank: 5, title: 'Nights', artist: 'Frank Ocean', year: 2016, rating: 4.5, reviews: 7821, cover: 'https://placehold.co/300x300/6c5b7b/c06c84?text=Nights' },
];

interface TopRatedSectionProps {
  type: 'albums' | 'canciones';
}

export const TopRatedSection = ({ type }: TopRatedSectionProps) => {
  const items = type === 'albums' ? TOP_ALBUMS : TOP_SONGS;
  const { openSignup } = useAuthModal();

  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <Award size={22} className="explore-section__header-icon" />
          <h2 className="explore-section__title">Mejores Calificados</h2>
        </div>
        <button className="explore-section__see-all" onClick={openSignup}>
          Ver todos <ChevronRight size={16} />
        </button>
      </div>

      <div className="explore-section__list">
        {items.map((item) => (
          <div key={item.id} className="music-list-item">
            <span className="music-list-item__rank">#{item.rank}</span>
            <div className="music-list-item__cover">
              <img src={item.cover} alt={item.title} loading="lazy" />
            </div>
            <div className="music-list-item__info">
              <h3 className="music-list-item__title">{item.title}</h3>
              <p className="music-list-item__meta">{item.artist} · {item.year}</p>
            </div>
            <div className="music-list-item__stats">
              <div className="music-list-item__rating">
                <Star size={14} fill="currentColor" />
                <span>{item.rating.toFixed(1)}</span>
              </div>
              <p className="music-list-item__reviews">{item.reviews.toLocaleString()} reseñas</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
