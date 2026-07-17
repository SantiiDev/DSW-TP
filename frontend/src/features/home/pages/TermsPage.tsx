import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';

export const TermsPage = () => {
  return (
    <>
      <Navbar />
      <main className="static-page">
        <FadeInSection>
          <div className="static-page__container">
            <h1 className="static-page__title">Condiciones de Uso</h1>
            <div className="static-page__content">
              <p>Última actualización: Agosto de 2026</p>
              
              <h2>1. Aceptación de los términos</h2>
              <p>Al acceder y utilizar Musicboxd ("nosotros", "nuestro", o "la plataforma"), aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder a nuestro servicio.</p>

              <h2>2. Uso de la plataforma</h2>
              <p>Musicboxd es un catálogo social de música y reseñas. Te comprometes a usar la plataforma únicamente con fines legales y de manera que no infrinja los derechos de, ni restrinja o inhiba el uso y disfrute de la plataforma por parte de terceros.</p>
              
              <h2>3. Contenido generado por el usuario</h2>
              <ul>
                <li>Eres responsable de las reseñas, listas y comentarios que publiques.</li>
                <li>No toleramos el lenguaje de odio, acoso ni contenido ofensivo. Todo contenido que viole estas reglas podrá ser eliminado sin previo aviso.</li>
                <li>Al publicar contenido, otorgas a Musicboxd una licencia no exclusiva para usar, reproducir y mostrar dicho contenido dentro de la plataforma.</li>
              </ul>

              <h2>4. Cuentas Pro y Facturación</h2>
              <p>Las suscripciones a Musicboxd Pro se facturan de forma recurrente. Puedes cancelar tu suscripción en cualquier momento, manteniendo los beneficios hasta el final del ciclo de facturación actual. No se realizan reembolsos parciales.</p>

              <h2>5. Modificaciones del servicio</h2>
              <p>Nos reservamos el derecho de modificar o discontinuar el servicio (o cualquier parte del mismo) temporal o permanentemente, con o sin previo aviso.</p>
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
