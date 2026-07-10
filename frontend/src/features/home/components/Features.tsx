import { Headphones, AlignLeft, Clock, Star, BadgeCheck } from 'lucide-react';
import './_features.scss';

export const Features = () => {
  return (
    <section className="features">
      <div className="features__container">
        <h2 className="features__title">Musicboxd te permite...</h2>

        <div className="features__grid">
          {/* Card 1 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--blue">
              <Headphones size={32} />
            </div>
            <p className="features-card__text">
              Lleva un registro de toda la música que has escuchado (o empieza desde el día en que te unes).
            </p>
          </div>

          {/* Card 2 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--red">
              <AlignLeft size={32} />
            </div>
            <p className="features-card__text">
              Escribe reseñas y califica la música para compartir tus opiniones con tus amigos y nuestra comunidad.
            </p>
          </div>

          {/* Card 3 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--green-badge">
              <span>1</span>
            </div>
            <p className="features-card__text">
              Organiza tu música en listas y presume de tus álbumes favoritos, clasifica la discografía de un artista y mucho más.
            </p>
          </div>

          {/* Card 4 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--green">
              <Clock size={32} />
            </div>
            <p className="features-card__text">
              Guarda la música que aún no has escuchado y mantente al día con los nuevos lanzamientos.
            </p>
          </div>

          {/* Card 5 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--yellow">
              <Star size={32} />
            </div>
            <p className="features-card__text">
              Explora nuestras secciones Top 250 y Más Populares para descubrir buena música y nuevos artistas.
            </p>
          </div>

          {/* Card 6 */}
          <div className="features-card">
            <div className="features-card__icon features-card__icon--blue-badge">
              <BadgeCheck size={32} />
            </div>
            <p className="features-card__text">
              Descubre estadísticas detalladas sobre tus intereses musicales y mucho más con Musicboxd Pro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
