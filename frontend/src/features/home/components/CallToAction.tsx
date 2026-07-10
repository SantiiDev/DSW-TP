import { Link } from 'react-router-dom';
import './_call-to-action.scss';

export const CallToAction = () => {
  return (
    <section className="cta-section">
      <div className="cta-section__container">
        <div className="cta-section__content">
          <h2 className="cta-section__title">Comienza a reseñar tu música.</h2>
          <p className="cta-section__subtitle">Únete gratis hoy mismo. Un mundo de música te espera.</p>

          <div className="cta-section__actions">
            <Link to="/login" className="cta-section__btn cta-section__btn--outline">
              Iniciar Sesión
            </Link>
            <Link to="/signup" className="cta-section__btn cta-section__btn--primary">
              Regístrate &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
