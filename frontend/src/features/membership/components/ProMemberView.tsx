// Cara "de socio" de la página /pro: la que ve un usuario que YA tiene la
// membresía paga. En vez del pitch de venta muestra el estado de su membresía,
// los accesos directos a lo que Pro le habilita y sus beneficios activos.
//
// Los únicos datos reales disponibles hoy son los del usuario logueado (nombre,
// rol y fecha de alta). Lo que todavía depende de features no implementadas
// —el detalle de facturación y las estadísticas— se muestra como estado vacío
// en lugar de inventar números.
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Crown,
  Disc3,
  LifeBuoy,
  Palette,
  PlusCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '../../../core/components/EmptyState';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { ROLE_LABELS } from '../../user/models/User';
import type { User } from '../../user/models/User';
import { ProBenefits } from './ProBenefits';

type ProMemberViewProps = {
  /** Usuario logueado con membresía Pro (o ADMIN, que la incluye). */
  user: User;
};

// Accesos directos a lo que la membresía habilita. Se declaran como data y no
// como JSX repetido: son tarjetas idénticas que solo cambian ícono, texto y destino.
const PRO_SHORTCUTS = [
  {
    icon: Palette,
    title: 'Personalizá tu perfil',
    description: 'Cambiá tu avatar y tus datos desde la edición de perfil.',
    to: '/profile',
    label: 'Ir a mi perfil',
  },
  {
    icon: PlusCircle,
    title: 'Aportá al catálogo',
    description: 'Cargá artistas, álbumes y canciones que falten. Un admin los aprueba.',
    to: '/profile',
    label: 'Ver mis aportes',
  },
  {
    icon: Disc3,
    title: 'Explorá sin anuncios',
    description: 'Recorré el catálogo completo y dejá tu próxima reseña.',
    to: '/music',
    label: 'Explorar música',
  },
];

export const ProMemberView = ({ user }: ProMemberViewProps) => {
  return (
    <>
      {/* ── Cabecera: identidad de socio Pro ─────── */}
      <FadeInSection delay={100}>
        <section className="pro-member__header">
          <span className="pro-member__badge">
            <Crown size={14} aria-hidden="true" />
            Musicboxd Pro
          </span>

          <h1 className="pro-member__title">
            Hola, <span className="pro-member__title-accent">{user.username}</span>
          </h1>
          <p className="pro-member__subtitle">
            Tu membresía está activa. Todo lo que sigue ya lo tenés habilitado.
          </p>

          <div className="pro-member__status">
            <div className="pro-member__status-item">
              <span className="pro-member__status-label">Plan</span>
              <span className="pro-member__status-value">{ROLE_LABELS[user.rol]}</span>
            </div>
            <div className="pro-member__status-item">
              <span className="pro-member__status-label">Miembro desde</span>
              <span className="pro-member__status-value">
                {user.registrationDate.toLocaleDateString('es-AR')}
              </span>
            </div>
            <div className="pro-member__status-item">
              <span className="pro-member__status-label">Anuncios</span>
              <span className="pro-member__status-value">Desactivados</span>
            </div>
          </div>

          {/* El admin ve además el acceso a su panel: es el rol que aprueba los
              aportes de catálogo que hacen los usuarios Pro. */}
          {user.isAdmin && (
            <Link to="/admin" className="pro-member__admin-link">
              <Shield size={16} aria-hidden="true" />
              Ir al panel de administración
            </Link>
          )}
        </section>
      </FadeInSection>

      {/* ── Accesos directos ─────────────────────── */}
      <FadeInSection delay={200}>
        <section className="pro-member__section">
          <h2 className="pro-member__heading">Sacale provecho a tu Pro</h2>
          <div className="pro-member__shortcuts">
            {PRO_SHORTCUTS.map(({ icon: Icon, title, description, to, label }) => (
              <Link key={title} to={to} className="pro-shortcut-card">
                <span className="pro-shortcut-card__icon" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <h3 className="pro-shortcut-card__title">{title}</h3>
                <p className="pro-shortcut-card__desc">{description}</p>
                <span className="pro-shortcut-card__link">{label} &rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* ── Estadísticas avanzadas (pendientes de datos) ── */}
      <FadeInSection delay={200}>
        <section className="pro-member__section">
          <h2 className="pro-member__heading">Tus estadísticas Pro</h2>
          <div className="pro-member__panel">
            <EmptyState
              icon={<BarChart3 size={22} />}
              title="Todavía no hay nada para graficar."
              message="Tus géneros más reseñados, tu evolución mensual y tu top de artistas se arman con tus reseñas. Calificá tu primer álbum y esta sección se llena sola."
              action={
                <Link to="/music" className="pro-member__panel-cta">
                  Buscar un álbum para reseñar
                </Link>
              }
            />
          </div>
        </section>
      </FadeInSection>

      {/* ── Beneficios, marcados como activos ────── */}
      <FadeInSection delay={200}>
        <ProBenefits heading="Tus beneficios activos" isActive />
      </FadeInSection>

      {/* ── Membresía y soporte ──────────────────── */}
      <FadeInSection delay={200}>
        <section className="pro-member__section">
          <h2 className="pro-member__heading">Tu membresía</h2>
          <div className="pro-member__cards">
            <div className="pro-member__card">
              <h3 className="pro-member__card-title">
                <Sparkles size={18} aria-hidden="true" />
                Facturación y renovación
              </h3>
              <p className="pro-member__card-text">
                El historial de pagos y la baja de la suscripción se gestionan desde tu perfil
                en cuanto quede conectada la pasarela de MercadoPago.
              </p>
              <Link to="/profile" className="pro-member__card-link">
                Ver mi membresía &rarr;
              </Link>
            </div>

            <div className="pro-member__card">
              <h3 className="pro-member__card-title">
                <LifeBuoy size={18} aria-hidden="true" />
                Soporte prioritario
              </h3>
              <p className="pro-member__card-text">
                Como socio Pro tus consultas se responden primero. Escribinos y te contestamos
                a la brevedad.
              </p>
              <Link to="/contact" className="pro-member__card-link">
                Contactar al equipo &rarr;
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>
    </>
  );
};
