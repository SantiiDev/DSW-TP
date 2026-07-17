// Componente UI para mostrar reviewers destacados (PopularReviewers).
// Presenta una lista vertical de usuarios populares, mostrando su avatar, nombre, insignias (badges) 
// y género musical favorito. Incluye un botón para seguirlos, conectado al flujo de autenticación.
import { Star, ChevronRight } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Datos iniciales de prueba (Mocks).
// Se estructuraron simulando la respuesta esperada del backend para facilitar la migración futura 
// a la API, respetando la forma del modelo de negocio (Reviewer).
const POPULAR_REVIEWERS = [
  { id: 1, username: 'critico_musical', name: 'Diego Ramírez', genre: 'Pop', initials: 'DR', color: '#9b59b6', badge: 'pro' as const },
  { id: 2, username: 'sonoradelsur', name: 'Ana García', genre: 'Rock', initials: 'AG', color: '#3498db', badge: 'pro' as const },
  { id: 3, username: 'ritmo_urbano', name: 'Carlos Vega', genre: 'Rap/Hip Hop', initials: 'CV', color: '#e74c3c', badge: null },
  { id: 4, username: 'folklorica22', name: 'María Torres', genre: 'Folk', initials: 'MT', color: '#f39c12', badge: null },
  { id: 5, username: 'electro.wave', name: 'Pablo Díaz', genre: 'Electrónica', initials: 'PD', color: '#1abc9c', badge: 'mod' as const },
  { id: 6, username: 'jazz.nocturno', name: 'Laura Sánchez', genre: 'Jazz', initials: 'LS', color: '#e67e22', badge: null },
  { id: 7, username: 'punk_revival', name: 'Tomás Herrera', genre: 'Punk', initials: 'TH', color: '#c0392b', badge: null },
  { id: 8, username: 'clasica_eterna', name: 'Sofía Molina', genre: 'Clásica', initials: 'SM', color: '#2c3e50', badge: 'pro' as const },
  { id: 9, username: 'reggae.roots', name: 'Mateo Silva', genre: 'Reggae', initials: 'MS', color: '#27ae60', badge: null },
  { id: 10, username: 'metal_head_ar', name: 'Fernando Ruiz', genre: 'Metal', initials: 'FR', color: '#7f8c8d', badge: 'mod' as const },
  { id: 11, username: 'bossa_lover', name: 'Valentina Costa', genre: 'Bossa Nova', initials: 'VC', color: '#d35400', badge: null },
  { id: 12, username: 'alt.universe', name: 'Ignacio Paz', genre: 'Alternativo', initials: 'IP', color: '#8e44ad', badge: null },
  { id: 13, username: 'indie_kid', name: 'Lucas Silva', genre: 'Indie', initials: 'LS', color: '#16a085', badge: 'pro' as const },
  { id: 14, username: 'synth.pop', name: 'Julieta Gómez', genre: 'Synthpop', initials: 'JG', color: '#c0392b', badge: null },
];

export const PopularReviewers = () => {
  const { openSignup } = useAuthModal();

  // Handler para el botón de seguir (se conectará al backend más adelante)
  const handleFollow = () => {
    openSignup();
  };

  return (
    <section className="popular-reviewers">
      <div className="members-section__header">
        <div className="members-section__header-left">
          <Star className="members-section__header-icon" size={20} />
          <h2 className="members-section__title">Reviewers Populares</h2>
        </div>
        <button className="members-section__see-all" onClick={openSignup}>
          Ver todos <ChevronRight size={16} />
        </button>
      </div>

      <div className="popular-reviewers__list">
        {POPULAR_REVIEWERS.map((reviewer) => (
          <div key={reviewer.id} className="reviewer-item">
            <div
              className="reviewer-item__avatar"
              style={{ backgroundColor: reviewer.color }}
            >
              {reviewer.initials}
            </div>

            <div className="reviewer-item__info">
              <p className="reviewer-item__username">
                {reviewer.username}
                {reviewer.badge && (
                  <span className={`reviewer-item__badge reviewer-item__badge--${reviewer.badge}`}>
                    {reviewer.badge}
                  </span>
                )}
              </p>
              <p className="reviewer-item__meta">
                {reviewer.name} • Entusiasta de {reviewer.genre}
              </p>
            </div>

            <button
              className="reviewer-item__follow-btn"
              onClick={handleFollow}
            >
              Seguir
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
