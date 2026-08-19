// Página /pro de Musicboxd. Tiene dos caras y elige una según quién esté mirando:
//
//   - visitante o usuario Free -> ProSalesView: el pitch de la membresía.
//   - usuario Pro (o Admin)    -> ProMemberView: el área de socio, con el estado
//                                 de su membresía y accesos a lo que le habilita.
//
// A quien ya pagó no tiene sentido volver a venderle el plan, igual que no tiene
// sentido ofrecerle registrarse a quien ya inició sesión.
import { useAuth } from '../../../core/context/AuthContext';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { ProMemberView } from '../components/ProMemberView';
import { ProSalesView } from '../components/ProSalesView';
import '../styles/_membership.scss';

export const ProPage = () => {
  const { state: authState } = useAuth();

  const isAuthenticated = authState.status === 'authenticated';
  const user = isAuthenticated ? authState.user : null;

  return (
    <>
      <Navbar />
      <main className={`pro-page ${user?.isPro ? 'pro-page--member' : ''}`}>
        {/* Mientras se valida el token guardado no se sabe todavía qué cara
            corresponde: mostrar la de venta y cambiarla un instante después
            haría parpadear la pantalla a un socio Pro. */}
        {authState.status === 'checking' ? (
          <Loader message="Cargando tu membresía..." />
        ) : user?.isPro ? (
          <ProMemberView user={user} />
        ) : (
          <ProSalesView isAuthenticated={isAuthenticated} />
        )}
      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
