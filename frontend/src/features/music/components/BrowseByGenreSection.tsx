// Sección de la página de exploración musical para descubrir álbumes y artistas por género.
import { Music2 } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

const GENRES = [
  { id: 1, name: 'Rock', albumCount: 24531, gradient: 'linear-gradient(135deg, #e94560, #0f3460)' },
  { id: 2, name: 'Hip Hop', albumCount: 18923, gradient: 'linear-gradient(135deg, #f5a623, #e94560)' },
  { id: 3, name: 'Pop', albumCount: 21432, gradient: 'linear-gradient(135deg, #48dbfb, #0abde3)' },
  { id: 4, name: 'R&B / Soul', albumCount: 12543, gradient: 'linear-gradient(135deg, #c06c84, #6c5b7b)' },
  { id: 5, name: 'Electrónica', albumCount: 15621, gradient: 'linear-gradient(135deg, #00cec9, #6c5ce7)' },
  { id: 6, name: 'Jazz', albumCount: 8932, gradient: 'linear-gradient(135deg, #fdcb6e, #e17055)' },
  { id: 7, name: 'Metal', albumCount: 11234, gradient: 'linear-gradient(135deg, #2d3436, #636e72)' },
  { id: 8, name: 'Indie', albumCount: 16543, gradient: 'linear-gradient(135deg, #a29bfe, #fd79a8)' },
  { id: 9, name: 'Folk', albumCount: 7654, gradient: 'linear-gradient(135deg, #55a630, #80b918)' },
  { id: 10, name: 'Clásica', albumCount: 6543, gradient: 'linear-gradient(135deg, #b8860b, #daa520)' },
  { id: 11, name: 'Punk', albumCount: 9876, gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' },
  { id: 12, name: 'Latino', albumCount: 13245, gradient: 'linear-gradient(135deg, #1dd1a1, #10ac84)' },
];

export const BrowseByGenreSection = () => {
  const { openSignup } = useAuthModal();
  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <Music2 size={22} className="explore-section__header-icon" />
          <h2 className="explore-section__title">Explorar por Género</h2>
        </div>
      </div>

      <div className="genre-grid">
        {GENRES.map((genre) => (
          <button key={genre.id} className="genre-card" style={{ background: genre.gradient }} onClick={openSignup}>
            <span className="genre-card__name">{genre.name}</span>
            <span className="genre-card__count">{genre.albumCount.toLocaleString()} álbumes</span>
          </button>
        ))}
      </div>
    </section>
  );
};
