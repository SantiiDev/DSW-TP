import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';

export const PrivacyPage = () => {
  return (
    <>
      <Navbar />
      <main className="static-page">
        <FadeInSection>
          <div className="static-page__container">
            <h1 className="static-page__title">Política de Privacidad</h1>
            <div className="static-page__content">
              <p>Última actualización: Agosto de 2026</p>

              <h2>1. Información que recopilamos</h2>
              <p>En Musicboxd, recopilamos diferentes tipos de información para mejorar tu experiencia:</p>
              <ul>
                <li><strong>Información de la cuenta:</strong> Nombre de usuario, dirección de correo electrónico y contraseña cuando te registras.</li>
                <li><strong>Datos de actividad:</strong> Álbumes escuchados, reseñas escritas, listas creadas y artistas seguidos.</li>
                <li><strong>Datos de conexión:</strong> Información sobre tu navegador, dirección IP y el dispositivo desde el que accedes.</li>
              </ul>

              <h2>2. Cómo usamos tu información</h2>
              <p>Utilizamos los datos recopilados para:</p>
              <ul>
                <li>Proporcionar y mantener nuestro catálogo musical social.</li>
                <li>Generar estadísticas avanzadas de escucha (especialmente para usuarios Pro).</li>
                <li>Mejorar nuestros algoritmos de recomendación.</li>
                <li>Garantizar la seguridad de las cuentas y prevenir fraudes o abusos.</li>
              </ul>

              <h2>3. Compartir información</h2>
              <p>No vendemos tus datos personales a terceros. Sin embargo, dado que Musicboxd es una plataforma social, tu perfil, reseñas y listas públicas pueden ser vistos por otros miembros de la comunidad.</p>

              <h2>4. Tus derechos</h2>
              <p>Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. Puedes administrar estas opciones directamente desde la configuración de tu cuenta.</p>

              <h2>5. Contacto</h2>
              <p>Si tienes preguntas sobre nuestra Política de Privacidad, puedes comunicarte con nuestro equipo desde la sección de Contacto.</p>
            </div>
          </div>
        </FadeInSection>
      </main>
      <FadeInSection delay={200}>
        <Footer />
      </FadeInSection>
    </>
  );
};
