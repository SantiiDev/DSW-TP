// Página principal de exploración de listas (/lists), con layout de dos columnas
// y efecto sticky/parallax en desktop.
//
// El filtro por género vive acá y no en ExploreTagsSection, porque lo necesitan
// dos secciones a la vez: el chip que se pinta activo y el feed que filtra.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { InlineNotice } from '../../../core/components/InlineNotice';
import { MyListsSection } from '../components/MyListsSection';
import { TopListsSection } from '../components/TopListsSection';
import { ExploreTagsSection } from '../components/ExploreTagsSection';
import { TrendingListsSection } from '../components/TrendingListsSection';
import '../styles/_lists-explore.scss';

/**
 * Lo que la ficha de una lista deja al eliminarla, para que el aviso se pueda
 * mostrar acá: esa pantalla ya no existe cuando la baja termina.
 */
export type ListsExploreState = {
  deletedListName?: string;
};

/** Cuánto queda en pantalla el aviso de "se eliminó" antes de borrarse solo. */
const NOTICE_MS = 4000;

export const ListsExplorePage = () => {
  const [genreId, setGenreId] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Se lee una sola vez, al montar: de ahí en más el aviso es estado propio de
  // esta pantalla y no depende más de cómo se llegó.
  const [deletedListName, setDeletedListName] = useState<string | null>(
    () => (location.state as ListsExploreState | null)?.deletedListName ?? null
  );

  useEffect(() => {
    if (!deletedListName) return;

    // Se borra el state del historial para que el aviso no vuelva a aparecer si
    // se recarga la página o si se llega de nuevo acá con el botón "atrás".
    navigate(location.pathname, { replace: true, state: null });

    const timer = setTimeout(() => setDeletedListName(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [deletedListName, location.pathname, navigate]);

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

            {/* Confirmación de la lista que se acaba de eliminar desde su ficha. */}
            {deletedListName && (
              <InlineNotice icon={<Trash2 size={14} />}>
                Se eliminó <strong>{deletedListName}</strong>
              </InlineNotice>
            )}
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
