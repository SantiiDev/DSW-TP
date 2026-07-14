// Sección de la página de exploración musical que muestra los últimos lanzamientos.
import { Star, Disc3, ChevronRight } from 'lucide-react';

const NEW_RELEASES = [
  { id: 1, title: 'Hurry Up Tomorrow', artist: 'The Weeknd', releaseDate: '25 Ene 2025', rating: 3.9, cover: 'https://placehold.co/300x300/2c003e/ff6348?text=HUT' },
  { id: 2, title: 'Eternal Sunshine', artist: 'Ariana Grande', releaseDate: '8 Mar 2025', rating: 3.7, cover: 'https://placehold.co/300x300/0c2461/48dbfb?text=ES' },
  { id: 3, title: 'Radical Optimism', artist: 'Dua Lipa', releaseDate: '3 May 2025', rating: 3.4, cover: 'https://placehold.co/300x300/6c5b7b/c06c84?text=RO' },
  { id: 4, title: 'The Great Impersonator', artist: 'Halsey', releaseDate: '25 Oct 2025', rating: 4.0, cover: 'https://placehold.co/300x300/1f4068/e8d21d?text=TGI' },
  { id: 5, title: 'Short n\' Sweet', artist: 'Sabrina Carpenter', releaseDate: '23 Ago 2025', rating: 3.6, cover: 'https://placehold.co/300x300/2d3436/00cec9?text=SnS' },
  { id: 6, title: 'Deeper Well', artist: 'Kacey Musgraves', releaseDate: '15 Mar 2025', rating: 3.8, cover: 'https://placehold.co/300x300/1b1b2f/e43f5a?text=DW' },
];

export const NewReleasesSection = () => {
  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <Disc3 size={22} className="explore-section__header-icon explore-section__header-icon--spin" />
          <h2 className="explore-section__title">Nuevos Lanzamientos</h2>
        </div>
        <button className="explore-section__see-all">
          Ver todos <ChevronRight size={16} />
        </button>
      </div>

      <div className="explore-section__grid">
        {NEW_RELEASES.map((item) => (
          <div key={item.id} className="music-card music-card--new">
            <div className="music-card__cover">
              <img src={item.cover} alt={item.title} loading="lazy" />
              <div className="music-card__badge">Nuevo</div>
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
              <p className="music-card__date">{item.releaseDate}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
