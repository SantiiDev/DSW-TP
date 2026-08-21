// Componente UI para presentar miembros activos recientes (FeaturedMembers).
// Muestra una cuadrícula (grid) horizontal de usuarios con sus respectivos avatares generados,
// nombre de usuario y controles de seguimiento.
import { Users } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useAuthModal } from '../../../core/context/AuthModalContext';

// Mocks de miembros destacados (diseñados simulando la estructura del backend para fácil integración posterior).
const FEATURED_MEMBERS = [
  { id: 1, username: 'melómano_ar', name: 'Martín López', initials: 'ML', color: '#e74c3c' },
  { id: 2, username: 'vinyl.queen', name: 'Lucía Fernández', initials: 'LF', color: '#8e44ad' },
  { id: 3, username: 'rockclásico99', name: 'Juan Pérez', initials: 'JP', color: '#2980b9' },
  { id: 4, username: 'indiesoul', name: 'Camila Ruiz', initials: 'CR', color: '#e67e22' },
  { id: 5, username: 'bass.drop', name: 'Nicolás Gómez', initials: 'NG', color: '#1abc9c' },
];

// Helper funcional (MemberAvatar) que renderiza un componente de avatar circular estilizado.
// Recibe como parámetros (props) las iniciales, el color de fondo y el tamaño opcional.
// Devuelve un elemento de interfaz reutilizable.
const MemberAvatar = ({ initials, color, size = 100 }: { initials: string; color: string; size?: number }) => (
  <div
    className="featured-member-card__avatar"
    style={{ backgroundColor: color, width: size, height: size }}
  >
    {initials}
  </div>
);

export const FeaturedMembers = () => {
  const { openSignup } = useAuthModal();

  // Handler para el botón de seguir (se conectará al backend más adelante)
  const handleFollow = () => {
    openSignup();
  };

  return (
    <section className="featured-members">
      <div className="members-section__header">
        <div className="members-section__header-left">
          <Users className="members-section__header-icon" size={22} />
          <h2 className="members-section__title">Miembros Destacados</h2>
        </div>
        <button className="members-section__see-all" onClick={openSignup}>
          Ver todos <ChevronRight size={16} />
        </button>
      </div>

      <div className="featured-members__grid">
        {FEATURED_MEMBERS.map((member) => (
          <div key={member.id} className="featured-member-card">
            <MemberAvatar initials={member.initials} color={member.color} />
            <div className="featured-member-card__info">
              <p className="featured-member-card__username">{member.username}</p>
              <p className="featured-member-card__name">{member.name}</p>
            </div>
            <button
              className="featured-member-card__follow-btn"
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
