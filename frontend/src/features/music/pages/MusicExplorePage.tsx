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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

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
                onClick={() => handleTabChange('albums')}
              >
                Álbumes
              </button>
              <button
                className={`music-explore__tab ${activeTab === 'canciones' ? 'music-explore__tab--active' : ''}`}
                onClick={() => handleTabChange('canciones')}
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
            <PopularThisWeekSection type={activeTab} />
          </FadeInSection>

          {/* Estas tres secciones son SOLO de álbumes y no aparecen en la pestaña
              de canciones: el año de lanzamiento y el género son datos del álbum,
              no de la pista (ver el DER). Un "Nuevos Lanzamientos" de canciones
              dejaría cada tracklist pegado en bloque, y "Explorar por Género" y
              "Explorar por Década" cuentan y listan álbumes. */}
          {activeTab === 'albums' && (
            <>
              <FadeInSection delay={200}>
                <NewReleasesSection />
              </FadeInSection>

              <FadeInSection delay={200}>
                <BrowseByGenreSection />
              </FadeInSection>

              <FadeInSection delay={200}>
                <BrowseByDecadeSection />
              </FadeInSection>
            </>
          )}
        </div>
      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
