// Sección de tags/categorías para explorar listas filtradas por género o temática.
import { Compass } from 'lucide-react';

// Tags de categorías para explorar listas (datos mock)
const EXPLORE_TAGS = [
  { id: 1, label: 'Rock', emoji: '🎸' },
  { id: 2, label: 'Hip-Hop', emoji: '🎤' },
  { id: 3, label: 'Pop', emoji: '🎵' },
  { id: 4, label: 'Jazz', emoji: '🎷' },
  { id: 5, label: 'Electrónica', emoji: '🎧' },
  { id: 6, label: 'R&B', emoji: '💜' },
  { id: 7, label: 'Lo Mejor del Año', emoji: '🏆' },
  { id: 8, label: 'Descubrimientos', emoji: '🔍' },
  { id: 9, label: 'Clásicos', emoji: '💿' },
  { id: 10, label: 'Indie', emoji: '🌿' },
  { id: 11, label: 'Metal', emoji: '🤘' },
  { id: 12, label: 'Latino', emoji: '🌎' },
  { id: 13, label: 'Soundtracks', emoji: '🎬' },
  { id: 14, label: 'Chill', emoji: '☕' },
];

export const ExploreTagsSection = () => {
  return (
    <section className="explore-tags">
      <div className="explore-tags__header">
        <Compass size={20} className="explore-tags__header-icon" />
        <h2 className="explore-tags__title">Explorar Listas</h2>
      </div>

      <div className="explore-tags__grid">
        {EXPLORE_TAGS.map((tag) => (
          <button key={tag.id} className="explore-tag">
            <span className="explore-tag__emoji">{tag.emoji}</span>
            <span className="explore-tag__label">{tag.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
