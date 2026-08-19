// Sección de "Llamada a la acción" (Call to Action) en la página de inicio.
// Para un visitante invita a registrarse; para alguien con la sesión iniciada
// ese mensaje ya no aplica, así que se lo reemplaza por accesos a su actividad.
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { useAuthModal } from '../../../core/context/AuthModalContext';
import './_call-to-action.scss';

export const CallToAction = () => {
  const { openLogin, openSignup } = useAuthModal();
  const { state: authState } = useAuth();

  const isAuthenticated = authState.status === 'authenticated';

  return (
    <section className="cta-section">
      <div className="cta-section__container">
        <div className="cta-section__content">
          {isAuthenticated ? (
            <>
              <h2 className="cta-section__title">Seguí reseñando tu música.</h2>
              <p className="cta-section__subtitle">
                Elegí tu próximo álbum o revisá todo lo que ya calificaste.
              </p>

              <div className="cta-section__actions">
                <Link to="/profile" className="cta-section__btn cta-section__btn--outline">
                  Mi perfil
                </Link>
                <Link to="/music" className="cta-section__btn cta-section__btn--primary">
                  Explorar música &rarr;
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="cta-section__title">Comienza a reseñar tu música.</h2>
              <p className="cta-section__subtitle">Únete gratis hoy mismo. Un mundo de música te espera.</p>

              <div className="cta-section__actions">
                <button onClick={openLogin} className="cta-section__btn cta-section__btn--outline">
                  Iniciar Sesión
                </button>
                <button onClick={openSignup} className="cta-section__btn cta-section__btn--primary">
                  Regístrate &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
