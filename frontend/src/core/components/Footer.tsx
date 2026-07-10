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
              <li><a href="#" className="footer__link">Acerca</a></li>
            </ul>
          </div>

          <div className="footer__column">
            <h3 className="footer__title">Legal</h3>
            <ul className="footer__list">
              <li><a href="#" className="footer__link">Condiciones de uso</a></li>
              <li><a href="#" className="footer__link">Política de privacidad</a></li>
              <li><a href="#" className="footer__link">Normas de la comunidad</a></li>
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
          <div className="footer__socials">
            <a href="#" className="footer__social-link" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
            </a>
            <a href="#" className="footer__social-link" aria-label="X (Twitter)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
