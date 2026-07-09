import { Navbar } from '../../core/components/Navbar';
import { Hero } from './components/Hero';
import { PopularAlbums } from './components/PopularAlbums';

export const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PopularAlbums />
      </main>
    </>
  );
};
