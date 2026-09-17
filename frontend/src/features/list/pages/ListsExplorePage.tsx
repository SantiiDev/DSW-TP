// Página principal de exploración de listas (/lists), con layout de dos columnas
// y efecto sticky/parallax en desktop.
//
// El filtro por género vive acá y no en ExploreTagsSection, porque lo necesitan
// dos secciones a la vez: el chip que se pinta activo y el feed que filtra.
import { useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { MyListsSection } from '../components/MyListsSection';
import { TopListsSection } from '../components/TopListsSection';
import { ExploreTagsSection } from '../components/ExploreTagsSection';
import { TrendingListsSection } from '../components/TrendingListsSection';
import '../styles/_lists-explore.scss';

export const ListsExplorePage = () => {
  const [genreId, setGenreId] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="lists-explore">
        {/* Encabezado Principal */}
        <FadeInSection delay={100}>
          <header className="lists-explore__header">
            <h1 className="lists-explore__title">Explorar Listas</h1>
            <p className="lists-explore__subtitle">
              Descubrí listas curadas por la comunidad. Rankings, recomendaciones y
              colecciones para todos los gustos musicales.
            </p>
          </header>
        </FadeInSection>

        {/* Layout de dos columnas: sidebar sticky + contenido principal */}
        <div className="lists-explore__content">
          {/* Columna izquierda (sticky en desktop) */}
          <aside className="lists-explore__sidebar">
            <FadeInSection delay={150}>
              <MyListsSection />
            </FadeInSection>

            <FadeInSection delay={175}>
              <TopListsSection />
            </FadeInSection>

            <FadeInSection delay={200}>
              <ExploreTagsSection selectedGenreId={genreId} onSelectGenre={setGenreId} />
            </FadeInSection>
          </aside>

          {/* Columna derecha (scrollea normalmente, crea el efecto parallax) */}
          <div className="lists-explore__main">
            <FadeInSection delay={200}>
              <TrendingListsSection genreId={genreId} />
            </FadeInSection>
          </div>
        </div>
      </main>
      <FadeInSection delay={300}>
        <Footer />
      </FadeInSection>
    </>
  );
};
