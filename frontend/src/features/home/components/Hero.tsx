import { Link } from 'react-router-dom';
import './_hero.scss';

export const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__background"></div>
      
      {/* Floating background albums */}
      <div className="hero__floating-albums">
        <img src="/images/abbey-road.jpg" alt="Abbey Road" className="floating-album floating-album--1" />
        <img src="/images/ahi-vamos.jpg" alt="Ahi Vamos" className="floating-album floating-album--2" />
        <img src="/images/audioslave.jpeg" alt="Audioslave" className="floating-album floating-album--3" />
        <img src="/images/frank-sinatra.webp" alt="Frank Sinatra" className="floating-album floating-album--4" />
        <img src="/images/oktubre.jpg" alt="Oktubre" className="floating-album floating-album--5" />
        <img src="/images/wish-you-where-here.jpeg" alt="Wish You Were Here" className="floating-album floating-album--6" />
      </div>

      <div className="hero__content">
        <h1 className="hero__title">
          Reseña tus álbumes favoritos.<br />
          Cataloga toda la música que escuchas.<br />
          Comparte tu pasión por la música.
        </h1>
        
        <p className="hero__description">
          Musicboxd es una plataforma social que te permite llevar un registro de toda la
          música que escuchas y hacer crecer tu pasión por la música con amigos. Escribe
          reseñas, califica álbumes y compila listas en la comunidad de mayor crecimiento en la música.
        </p>

        <Link to="/signup" className="hero__cta">
          ¡Únete a Musicboxd gratis!
        </Link>
      </div>
    </section>
  );
};
