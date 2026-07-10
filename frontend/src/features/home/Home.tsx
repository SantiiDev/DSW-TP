import { Navbar } from '../../core/components/Navbar';
import { Footer } from '../../core/components/Footer';
import { Hero } from './components/Hero';
import { PopularAlbums } from './components/PopularAlbums';
import { Features } from './components/Features';
import { CallToAction } from './components/CallToAction';

export const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PopularAlbums />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
};
