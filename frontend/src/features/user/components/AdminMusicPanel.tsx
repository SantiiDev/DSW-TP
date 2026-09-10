// Pestaña "Música" del panel de administración: el ABM del catálogo.
//
// Un selector interno separa las cuatro entidades (artistas, álbumes, canciones y
// géneros) en vez de sumar cuatro pestañas más arriba: son variantes de la misma
// tarea, y así la barra principal sigue mostrando las tres áreas del panel.
//
// Las cuatro trabajan contra la API (`/api/artists`, `/api/albums`, `/api/songs`
// y `/api/genres`), cada una en la sección que aporta su propia feature: acá solo
// se elige cuál se monta.
import { useState } from 'react';
import { Disc3, Mic2, Music, Tags } from 'lucide-react';
import { Card } from '../../../core/components/Card';
import { ViewSwitcher } from '../../../core/components/ViewSwitcher';
import type { ViewOption } from '../../../core/components/ViewSwitcher';
import { AlbumAdminSection } from '../../album/components/AlbumAdminSection';
import { ArtistAdminSection } from '../../artist/components/ArtistAdminSection';
import { GenreAdminSection } from '../../genre/components/GenreAdminSection';
import { SongAdminSection } from '../../song/components/SongAdminSection';

const CATALOG_SECTIONS = [
  { id: 'artists', label: 'Artistas', icon: Mic2 },
  { id: 'albums', label: 'Álbumes', icon: Disc3 },
  { id: 'songs', label: 'Canciones', icon: Music },
  { id: 'genres', label: 'Géneros', icon: Tags },
] as const;

type CatalogSectionId = (typeof CATALOG_SECTIONS)[number]['id'];

// Lo que espera el conmutador: value + label. El ícono de cada sección no le
// hace falta.
const SECTION_OPTIONS: ViewOption<CatalogSectionId>[] = CATALOG_SECTIONS.map(({ id, label }) => ({
  value: id,
  label,
}));

export const AdminMusicPanel = () => {
  const [activeSection, setActiveSection] = useState<CatalogSectionId>('artists');

  return (
    <Card
      title="Catálogo de música"
      subtitle="Alta, edición y baja de los artistas, álbumes, canciones y géneros de Musicboxd."
    >
      {/* El mismo conmutador que separa álbumes de canciones en /music y la
          comunidad de los amigos en /reseñas: es el interruptor principal de la
          pantalla, y acá elige cuál de los cuatro ABM se está usando. */}
      <div className="admin-panel__switcher">
        <ViewSwitcher
          options={SECTION_OPTIONS}
          value={activeSection}
          // Va envuelto y no como `setActiveSection` a secas: el tipo que espera un
          // setter de useState admite también una función, y con eso TypeScript no
          // logra deducir cuál es el tipo de las opciones.
          onChange={(section) => setActiveSection(section)}
          ariaLabel="Entidad del catálogo"
          // Va dentro de una tarjeta: la caja del conmutador toma el color del
          // fondo de la sección para despegarse de ella.
          tone="sunken"
        />
      </div>

      {activeSection === 'artists' ? (
        <ArtistAdminSection />
      ) : activeSection === 'albums' ? (
        <AlbumAdminSection />
      ) : activeSection === 'songs' ? (
        <SongAdminSection />
      ) : (
        <GenreAdminSection />
      )}
    </Card>
  );
};
