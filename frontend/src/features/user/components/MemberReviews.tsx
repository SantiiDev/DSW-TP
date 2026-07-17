// Componente UI para mostrar las reseñas más recientes (MemberReviews).
// Compone tarjetas complejas que incluyen información del álbum criticado, el resumen (excerpt) 
// de la reseña, y la valoración en estrellas del usuario, junto con sus métricas de interacción.
import { MessageSquare, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Mocks de reseñas estructurados como DTOs (Data Transfer Objects) que incluirían relaciones (Reviewer y Album).
const MEMBER_REVIEWS = [
  {
    id: 1,
    albumId: 101,
    albumTitle: 'Disintegration',
    artistName: 'The Cure',
    coverUrl: 'https://placehold.co/150x150/1ED760/000000?text=Cure',
    reviewTitle: 'Escuchando The Cure diferente',
    rating: 4.5,
    excerpt: 'Si viste mi reseña de "Disintegration", ya sabés cuánto amé ese álbum. Como voy a ver a The Cure en vivo este viernes, me pareció el momento perfecto para seguir con su discografía. Lo primero que me llamó la atención fue lo diferente que suena este álbum comparado con todo lo que había escuchado de ellos.',
    likes: 59,
    comments: 10,
    reviewer: {
      username: 'Wish',
      avatarColor: '#e74c3c',
      initials: 'W'
    }
  },
  {
    id: 2,
    albumId: 102,
    albumTitle: 'Facelift',
    artistName: 'Alice in Chains',
    coverUrl: 'https://placehold.co/150x150/9b59b6/FFFFFF?text=Alice',
    reviewTitle: 'Mi reseña N° 72 (no el mejor de grunge)',
    rating: 3.5,
    excerpt: 'El debut de Alice in Chains es sólido. Un saludo para pachedzhiev por recomendarme este álbum. De todas formas, para ser honesto, este no es el mejor álbum de grunge. Para empezar, tiene más vibra de álbum de metal que de grunge. Es como decir que KoRn era grunge de Seattle.',
    likes: 7,
    comments: 4,
    reviewer: {
      username: 'grunge_fan',
      avatarColor: '#2980b9',
      initials: 'GF'
    }
  }
];

// Función de ayuda (StarRating) para dibujar visualmente la calificación.
// Recibe un rating numérico (ej: 4.5) y devuelve una colección de elementos span ('estrellas')
// llenas o vacías dependiendo del valor.
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="review-card__rating">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="star">★</span>
      ))}
      {hasHalfStar && <span className="star">★</span>} {/* Simplificado para este mock */}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="star star--empty">★</span>
      ))}
    </div>
  );
};

export const MemberReviews = () => {
  const { openSignup } = useAuthModal();
  return (
    <section className="member-reviews">
      <div className="members-section__header">
        <div className="members-section__header-left">
          <MessageSquare className="members-section__header-icon" size={20} />
          <h2 className="members-section__title">Reseñas de Miembros</h2>
        </div>
      </div>

      <div className="member-reviews__list">
        {MEMBER_REVIEWS.map((review) => (
          <article key={review.id} className="review-card">
            {/* Cabecera: Info del álbum y reviewer */}
            <header className="review-card__header">
              <div className="review-card__cover">
                <img src={review.coverUrl} alt={`Portada de ${review.albumTitle}`} loading="lazy" />
              </div>
              <div className="review-card__album-info">
                <h3 className="review-card__album-title">{review.albumTitle}</h3>
                <p className="review-card__album-meta">
                  {review.reviewer.username} • Álbum
                </p>
              </div>
            </header>

            {/* Cuerpo de la reseña */}
            <h4 className="review-card__title">{review.reviewTitle}</h4>
            <StarRating rating={review.rating} />
            
            <p className="review-card__excerpt">
              {review.excerpt}
            </p>
            <button className="review-card__read-more" onClick={() => openSignup()}>Leer más...</button>

            {/* Footer con stats y acciones */}
            <footer className="review-card__footer">
              <div className="review-card__stats">
                <div className="review-card__stat" title="Me gusta" onClick={openSignup} style={{ cursor: 'pointer' }}>
                  <Heart size={16} />
                  <span>{review.likes}</span>
                </div>
                <div className="review-card__stat" title="Comentarios" onClick={openSignup} style={{ cursor: 'pointer' }}>
                  <MessageCircle size={16} />
                  <span>{review.comments}</span>
                </div>
              </div>
              
              <div className="review-card__actions">
                <button className="review-card__action-btn" aria-label="Comentar" onClick={openSignup}>
                  <MessageCircle size={18} />
                </button>
                <button className="review-card__action-btn" aria-label="Compartir" onClick={openSignup}>
                  <Share2 size={18} />
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
};
