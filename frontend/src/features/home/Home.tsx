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
