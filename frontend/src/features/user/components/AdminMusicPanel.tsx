// Pestaña "Música" del panel de administración: el ABM del catálogo.
//
// Un selector interno separa las tres entidades (artistas, álbumes y canciones)
// en vez de sumar tres pestañas más arriba: son variantes de la misma tarea, y
// así la barra principal sigue mostrando las tres áreas del panel.
//
// El listado de cada entidad se conecta cuando existan sus endpoints
// (`/api/artists`, `/api/albums`, `/api/songs`): hasta entonces cada sección
// muestra su estado vacío definitivo, igual que hace el perfil. Cuando estén,
// se reemplaza el EmptyState por la tabla sin tocar ni el selector ni la pestaña.
import { useState } from 'react';
import { Disc3, Mic2, Music } from 'lucide-react';
import { EmptyState } from '../../../core/components/EmptyState';

const CATALOG_SECTIONS = [
  {
    id: 'artists',
    label: 'Artistas',
    icon: Mic2,
    title: 'El listado de artistas todavía no está conectado.',
    message:
      'Acá vas a poder dar de alta artistas, editar su nombre y su biografía, y darlos de baja.',
  },
  {
    id: 'albums',
    label: 'Álbumes',
    icon: Disc3,
    title: 'El listado de álbumes todavía no está conectado.',
    message:
      'Acá vas a poder crear álbumes, asignarles artista, año y géneros, y corregir su portada.',
  },
  {
    id: 'songs',
    label: 'Canciones',
    icon: Music,
    title: 'El listado de canciones todavía no está conectado.',
    message:
      'Acá vas a poder cargar las canciones de cada álbum, con su número de pista y su duración.',
  },
] as const;

type CatalogSectionId = (typeof CATALOG_SECTIONS)[number]['id'];

export const AdminMusicPanel = () => {
  const [activeSection, setActiveSection] = useState<CatalogSectionId>('artists');

  // El `!` es seguro: activeSection solo puede tomar los ids de la propia lista.
  const section = CATALOG_SECTIONS.find((item) => item.id === activeSection)!;
  const Icon = section.icon;

  return (
    <section className="admin-panel__block">
      <header className="admin-panel__block-header">
        <h2 className="admin-panel__block-title">Catálogo de música</h2>
        <p className="admin-panel__block-subtitle">
          Alta, edición y baja de los artistas, álbumes y canciones de Musicboxd.
        </p>
      </header>

      <div className="admin-panel__segments" role="group" aria-label="Entidad del catálogo">
        {CATALOG_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`admin-panel__segment ${
              activeSection === id ? 'admin-panel__segment--active' : ''
            }`}
            aria-pressed={activeSection === id}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <EmptyState icon={<Icon size={22} />} title={section.title} message={section.message} />
    </section>
  );
};
