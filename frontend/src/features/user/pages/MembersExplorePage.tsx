// Página principal de exploración de miembros (/members).
// Construye el layout de dos columnas para visualizar la comunidad.
// Integra componentes independientes que muestran miembros destacados, reviewers populares
// y actividad reciente (listas/reseñas), preparándolos para conectarse con el backend.
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { FeaturedMembers } from '../components/FeaturedMembers';
import { PopularReviewers } from '../components/PopularReviewers';
import { MemberReviews } from '../components/MemberReviews';
import { MemberLists } from '../components/MemberLists';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import '../styles/_members-explore.scss';

export const MembersExplorePage = () => {
  const { openSignup } = useAuthModal();
  return (
    <>
      <Navbar />
      <main className="members-explore">
        {/* Encabezado Principal */}
        <FadeInSection delay={100}>
          <header className="members-explore__header">
            <h1 className="members-explore__title">
              Amigos y amantes de la música — encontrá miembros populares.
            </h1>
            <p className="members-explore__subtitle">
              Conectá con otros entusiastas de la música en Musicboxd. Descubrí perfiles,
              leé sus reseñas y participá en la comunidad.
            </p>
            <button onClick={() => openSignup()} className="members-explore__cta">
              Unirse a la comunidad
            </button>
          </header>
        </FadeInSection>

        <div className="members-explore__content">
          {/* Fila Horizontal: Miembros Destacados */}
          <FadeInSection delay={150}>
            <FeaturedMembers />
          </FadeInSection>

          {/* Layout 2 Columnas (Desktop) */}
          <div className="members-explore__two-columns">
            {/* Columna Izquierda (Side): Reviewers Populares */}
            <aside className="members-explore__column members-explore__column--side">
              <FadeInSection delay={200}>
                <PopularReviewers />
              </FadeInSection>
            </aside>

            {/* Columna Derecha (Main): Reseñas y Listas */}
            <div className="members-explore__column members-explore__column--main">
              <FadeInSection delay={250}>
                <MemberReviews />
              </FadeInSection>

              <FadeInSection delay={300}>
                <MemberLists />
              </FadeInSection>
            </div>
          </div>
        </div>
      </main>
      <FadeInSection delay={350}>
        <Footer />
      </FadeInSection>
    </>
  );
};
