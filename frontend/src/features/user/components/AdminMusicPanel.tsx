// Pestaña "Música" del panel de administración: el ABM del catálogo.
//
// Un selector interno separa las cuatro entidades (artistas, álbumes, canciones y
// géneros) en vez de sumar cuatro pestañas más arriba: son variantes de la misma
// tarea, y así la barra principal sigue mostrando las tres áreas del panel.
//
// Artistas y géneros ya trabajan contra la API (`/api/artists` y `/api/genres`),
// en las secciones que aportan sus features. Álbumes y canciones siguen mostrando
// su estado vacío definitivo hasta que existan sus endpoints; cuando estén, se
// reemplaza el EmptyState por su sección sin tocar ni el selector ni la pestaña.
import { useState } from 'react';
import { Disc3, Mic2, Music, Tags } from 'lucide-react';
import { Card } from '../../../core/components/Card';
import { EmptyState } from '../../../core/components/EmptyState';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import type { SegmentOption } from '../../../core/components/SegmentedControl';
import { ArtistAdminSection } from '../../artist/components/ArtistAdminSection';
import { GenreAdminSection } from '../../genre/components/GenreAdminSection';

const CATALOG_SECTIONS = [
  { id: 'artists', label: 'Artistas', icon: Mic2 },
  { id: 'albums', label: 'Álbumes', icon: Disc3 },
  { id: 'songs', label: 'Canciones', icon: Music },
  { id: 'genres', label: 'Géneros', icon: Tags },
] as const;

type CatalogSectionId = (typeof CATALOG_SECTIONS)[number]['id'];

// Lo que espera el selector de segmentos: value + label. El ícono de cada
// sección solo se usa para el estado vacío, así que no viaja hasta el selector.
const SECTION_OPTIONS: SegmentOption<CatalogSectionId>[] = CATALOG_SECTIONS.map(
  ({ id, label }) => ({ value: id, label })
);

/** Texto del estado vacío de las entidades que todavía no tienen endpoints. */
const PENDING_SECTIONS: Record<'albums' | 'songs', { title: string; message: string }> = {
  albums: {
    title: 'El listado de álbumes todavía no está conectado.',
    message:
      'Acá vas a poder crear álbumes, asignarles artista, año y géneros, y corregir su portada.',
  },
  songs: {
    title: 'El listado de canciones todavía no está conectado.',
    message:
      'Acá vas a poder cargar las canciones de cada álbum, con su número de pista y su duración.',
  },
};

export const AdminMusicPanel = () => {
  const [activeSection, setActiveSection] = useState<CatalogSectionId>('artists');

  // El `!` es seguro: activeSection solo puede tomar los ids de la propia lista.
  const section = CATALOG_SECTIONS.find((item) => item.id === activeSection)!;
  const Icon = section.icon;

  return (
    <Card
      title="Catálogo de música"
      subtitle="Alta, edición y baja de los artistas, álbumes, canciones y géneros de Musicboxd."
    >
      <SegmentedControl
        options={SECTION_OPTIONS}
        value={activeSection}
        // Va envuelto y no como `setActiveSection` a secas: el tipo que espera un
        // setter de useState admite también una función, y con eso TypeScript no
        // logra deducir cuál es el tipo de las opciones.
        onChange={(section) => setActiveSection(section)}
        ariaLabel="Entidad del catálogo"
      />

      {activeSection === 'artists' ? (
        <ArtistAdminSection />
      ) : activeSection === 'genres' ? (
        <GenreAdminSection />
      ) : (
        <EmptyState
          icon={<Icon size={22} />}
          title={PENDING_SECTIONS[activeSection].title}
          message={PENDING_SECTIONS[activeSection].message}
        />
      )}
    </Card>
  );
};
