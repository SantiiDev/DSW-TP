// Componente del pie de página (Footer) de la aplicación, que contiene enlaces rápidos, la suscripción al boletín de noticias y derechos reservados.
import { ArrowRight } from 'lucide-react';
import './_footer.scss';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__top">
          <div className="footer__column">
            <h3 className="footer__title">Tablero de música</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Inicio</a></li>
              <li><a href="#" className="footer__link footer__link--pro">Pro</a></li>
            </ul>
          </div>

          <div className="footer__column">
            <h3 className="footer__title">Legal</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Condiciones de uso</a></li>
              <li><a href="#" className="footer__link">Política de privacidad</a></li>
            </ul>
          </div>

          <div className="footer__column">
            <h3 className="footer__title">Compañía</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Preguntas frecuentes</a></li>
              <li><a href="#" className="footer__link">Contacto</a></li>
            </ul>
          </div>

          <div className="footer__column footer__column--newsletter">
            <h3 className="footer__title">Suscríbete a nuestro boletín informativo</h3>
            <p className="footer__text">Mantente al día de los últimos lanzamientos, noticias y ofertas.</p>
            <form className="footer__form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Correo electrónico"
                className="footer__input"
                required
              />
              <button type="submit" className="footer__button">
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 Musicboxd AB. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
