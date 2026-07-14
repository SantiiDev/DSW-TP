// Página principal de exploración musical que agrupa diversas secciones de descubrimiento.
import { useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { TrendingSection } from '../components/TrendingSection';
import { TopRatedSection } from '../components/TopRatedSection';
import { NewReleasesSection } from '../components/NewReleasesSection';
import { PopularThisWeekSection } from '../components/PopularThisWeekSection';
import { BrowseByGenreSection } from '../components/BrowseByGenreSection';
import { BrowseByDecadeSection } from '../components/BrowseByDecadeSection';
import '../styles/_music-explore.scss';

type Tab = 'albums' | 'canciones';

export const MusicExplorePage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('albums');

  return (
    <>
      <Navbar />
      <main className="music-explore">
        {/* Page Header */}
        <FadeInSection delay={100}>
          <header className="music-explore__header">
            <h1 className="music-explore__title">Explorar Música</h1>
            <p className="music-explore__subtitle">
              Descubrí nuevos álbumes, canciones y artistas según las reseñas y calificaciones de nuestra comunidad.
            </p>

            {/* Tab Switcher */}
            <div className="music-explore__tabs">
              <button
                className={`music-explore__tab ${activeTab === 'albums' ? 'music-explore__tab--active' : ''}`}
                onClick={() => setActiveTab('albums')}
              >
                Álbumes
              </button>
              <button
                className={`music-explore__tab ${activeTab === 'canciones' ? 'music-explore__tab--active' : ''}`}
                onClick={() => setActiveTab('canciones')}
              >
                Canciones
              </button>
            </div>
          </header>
        </FadeInSection>

        {/* Content Sections */}
        <div className="music-explore__content">
          <FadeInSection delay={150}>
            <TrendingSection type={activeTab} />
          </FadeInSection>

          <FadeInSection delay={200}>
            <TopRatedSection type={activeTab} />
          </FadeInSection>

          <FadeInSection delay={200}>
            <NewReleasesSection />
          </FadeInSection>

          <FadeInSection delay={200}>
            <PopularThisWeekSection type={activeTab} />
          </FadeInSection>

          <FadeInSection delay={200}>
            <BrowseByGenreSection />
          </FadeInSection>

          <FadeInSection delay={200}>
            <BrowseByDecadeSection />
          </FadeInSection>
        </div>
      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
