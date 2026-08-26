// Sección de listas top que muestra un ranking de las listas más populares de la comunidad.
import { Trophy, Heart } from 'lucide-react';
import { SectionHeader } from '../../../core/components/SectionHeader';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Datos mock de listas populares (se reemplazará por datos del backend más adelante)
const TOP_LISTS = [
  { id: 1, title: 'Top Álbumes de Todos los Tiempos', itemCount: 250, likes: 4821, author: 'musicboxd' },
  { id: 2, title: 'Lo Mejor del 2025', itemCount: 100, likes: 3654, author: 'santino_g' },
  { id: 3, title: 'Esenciales del Rock', itemCount: 150, likes: 2987, author: 'rock_classics' },
  { id: 4, title: 'Hip-Hop Imprescindible', itemCount: 120, likes: 2543, author: 'hiphop_head' },
  { id: 5, title: 'Clásicos del Jazz', itemCount: 80, likes: 1876, author: 'jazz_lover' },
  { id: 6, title: 'Álbumes que Definieron los 90s', itemCount: 90, likes: 1654, author: 'retro_vibes' },
  { id: 7, title: 'Pop Moderno Esencial', itemCount: 75, likes: 1432, author: 'pop_nation' },
  { id: 8, title: 'Electrónica Underground', itemCount: 60, likes: 1210, author: 'synth_wave' },
];

export const TopListsSection = () => {
  const { openSignup } = useAuthModal();

  return (
    <section className="top-lists">
      <SectionHeader
        icon={<Trophy size={20} />}
        title="Top Listas"
        iconTone="gold"
        actionLabel="Ver todas"
        onAction={openSignup}
      />

      <div className="top-lists__list">
        {TOP_LISTS.map((list, index) => (
          <div key={list.id} className="top-list-item" onClick={openSignup} style={{ cursor: 'pointer' }}>
            <span className="top-list-item__rank">{index + 1}</span>
            <div className="top-list-item__info">
              <h3 className="top-list-item__title">{list.title}</h3>
              <p className="top-list-item__meta">
                {list.itemCount} álbumes · por <span className="top-list-item__author">@{list.author}</span>
              </p>
            </div>
            <div className="top-list-item__likes">
              <Heart size={14} />
              <span>{list.likes.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
