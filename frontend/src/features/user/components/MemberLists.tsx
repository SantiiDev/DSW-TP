// Componente UI para exponer listas de música creadas por la comunidad (MemberLists).
// Renderiza tarjetas (cards) que muestran los metadatos de la lista (título, descripción), 
// estadísticas sociales y un collage dinámico con las portadas de los álbumes incluidos.
import { ListMusic, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Mocks de listas de música (estructuradas con covers en array simulando los resultados de búsqueda en BD).
const MEMBER_LISTS = [
  {
    id: 1,
    title: 'RYM Top 100 1978 Albums',
    description: 'https://rateyourmusic.com/charts/top/album/1978/',
    covers: [
      'https://placehold.co/150x150/1ED760/000000?text=RYM',
      'https://placehold.co/150x150/9b59b6/FFFFFF?text=1978',
      'https://placehold.co/150x150/e74c3c/FFFFFF?text=Top',
      'https://placehold.co/150x150/3498db/FFFFFF?text=100'
    ],
    likes: 13,
    comments: 8
  },
  {
    id: 2,
    title: 'Artists albums ranked',
    description: 'These are artists where I\'ve listened to AT LEAST 3 of their albums and I just rank them based on the artist. This list could change over time for sure especially if the artist drops a new album which I love than the ones on this list',
    covers: [
      'https://placehold.co/150x150/f39c12/FFFFFF?text=Rank',
      'https://placehold.co/150x150/1abc9c/FFFFFF?text=List',
      'https://placehold.co/150x150/e67e22/FFFFFF?text=Art',
      'https://placehold.co/150x150/34495e/FFFFFF?text=Fav'
    ],
    likes: 4,
    comments: 2
  }
];

export const MemberLists = () => {
  const { openSignup } = useAuthModal();
  return (
    <section className="member-lists">
      <div className="members-section__header">
        <div className="members-section__header-left">
          <ListMusic className="members-section__header-icon" size={20} />
          <h2 className="members-section__title">Listas de Miembros</h2>
        </div>
      </div>

      <div className="member-lists__grid">
        {MEMBER_LISTS.map((list) => (
          <article key={list.id} className="list-card" onClick={openSignup} style={{ cursor: 'pointer' }}>
            {/* Collage de imágenes */}
            <div className="list-card__collage">
              {list.covers.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt={`Portada ${i + 1} de la lista`} 
                  className="list-card__collage-img"
                  loading="lazy" 
                />
              ))}
            </div>

            {/* Info de la lista */}
            <div className="list-card__body">
              <h3 className="list-card__title">{list.title}</h3>
              <p className="list-card__description">{list.description}</p>

              {/* Footer con stats */}
              <footer className="list-card__footer">
                <div className="list-card__stats">
                  <div className="list-card__stat" title="Me gusta">
                    <Heart size={16} />
                    <span>{list.likes}</span>
                  </div>
                  <div className="list-card__stat" title="Comentarios">
                    <MessageCircle size={16} />
                    <span>{list.comments}</span>
                  </div>
                </div>
                
                <div className="list-card__actions">
                  <button className="list-card__action-btn" aria-label="Compartir">
                    <Share2 size={18} />
                  </button>
                </div>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
