// Sección de "Llamada a la acción" (Call to Action) en la página de inicio para invitar a registrarse.
import { useAuthModal } from '../../../core/context/AuthModalContext';
import './_call-to-action.scss';

export const CallToAction = () => {
  const { openLogin, openSignup } = useAuthModal();

  return (
    <section className="cta-section">
      <div className="cta-section__container">
        <div className="cta-section__content">
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
        </div>
      </div>
    </section>
  );
};
