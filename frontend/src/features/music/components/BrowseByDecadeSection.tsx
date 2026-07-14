import { Calendar } from 'lucide-react';

const DECADES = [
  { id: 1, decade: '2020s', years: '2020 – Presente', albumCount: 8432, emoji: '🔥' },
  { id: 2, decade: '2010s', years: '2010 – 2019', albumCount: 15621, emoji: '💫' },
  { id: 3, decade: '2000s', years: '2000 – 2009', albumCount: 12453, emoji: '💿' },
  { id: 4, decade: '1990s', years: '1990 – 1999', albumCount: 11234, emoji: '📀' },
  { id: 5, decade: '1980s', years: '1980 – 1989', albumCount: 9876, emoji: '🎸' },
  { id: 6, decade: '1970s', years: '1970 – 1979', albumCount: 8765, emoji: '🎵' },
  { id: 7, decade: '1960s', years: '1960 – 1969', albumCount: 6543, emoji: '✌️' },
  { id: 8, decade: 'Pre-1960', years: 'Antes de 1960', albumCount: 4321, emoji: '🎺' },
];

export const BrowseByDecadeSection = () => {
  return (
    <section className="explore-section">
      <div className="explore-section__header">
        <div className="explore-section__header-left">
          <Calendar size={22} className="explore-section__header-icon" />
          <h2 className="explore-section__title">Explorar por Década</h2>
        </div>
      </div>

      <div className="decade-grid">
        {DECADES.map((item) => (
          <button key={item.id} className="decade-card">
            <span className="decade-card__emoji">{item.emoji}</span>
            <div className="decade-card__info">
              <span className="decade-card__decade">{item.decade}</span>
              <span className="decade-card__years">{item.years}</span>
            </div>
            <span className="decade-card__count">{item.albumCount.toLocaleString()} álbumes</span>
          </button>
        ))}
      </div>
    </section>
  );
};
