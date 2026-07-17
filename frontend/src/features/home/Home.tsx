// Página principal (Home).
// Ensambla de forma secuencial las distintas secciones de presentación (Hero, Álbumes populares,
// Características y Llamado a la acción) utilizando animaciones de entrada (FadeInSection).
// Actúa como el 'landing' o pantalla de inicio (ruta '/') del frontend.
import { Navbar } from '../../core/components/Navbar';
import { Footer } from '../../core/components/Footer';
import { Hero } from './components/Hero';
import { PopularAlbums } from './components/PopularAlbums';
import { Features } from './components/Features';
import { CallToAction } from './components/CallToAction';
import { FadeInSection } from '../../core/components/FadeInSection';

export const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <FadeInSection delay={100}>
          <Hero />
        </FadeInSection>
        <FadeInSection delay={200}>
          <PopularAlbums />
        </FadeInSection>
        <FadeInSection delay={200}>
          <Features />
        </FadeInSection>
        <FadeInSection delay={200}>
          <CallToAction />
        </FadeInSection>
      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
