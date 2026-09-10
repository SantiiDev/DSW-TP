// Pestaña "Solicitudes" del panel de administración: la cola de moderación de
// los aportes al catálogo que hacen los usuarios Pro (CUU 3 de la propuesta).
//
// Cuando un usuario Pro carga un artista, un álbum o una canción, el registro
// entra con state = 'pending' y no lo ve nadie más hasta que un ADMIN lo aprueba
// o lo rechaza desde acá.
//
// Hay DOS controles, y son distintos a propósito:
//   1. el conmutador de arriba elige QUÉ se está moderando (artistas, álbumes o
//      canciones). Es el mismo de /music y del ABM del catálogo: cambia la
//      pantalla entera.
//   2. el desplegable de abajo FILTRA esa cola por estado, con "Todas" incluido
//      para ver el historial completo de esa entidad de una sola vez. Es el mismo
//      control que filtra por estado las tablas de la pestaña "Música".
//
// Se separa por entidad, igual que la pestaña "Música", porque las tres colas son
// independientes: aprobar los artistas pendientes no dice nada sobre los álbumes
// que quedaron esperando. Los géneros no aparecen porque no son contenido
// aportable (no tienen state ni created_by en el DER): los carga un ADMIN
// directamente desde la pestaña "Música".
//
// Cada cola la aporta su propia feature; acá solo se elige cuál se monta y se
// arman los textos del estado vacío, que dependen de la entidad y del estado.
import { useState } from 'react';
import { CheckCircle2, Clock, Disc3, Inbox, Mic2, Music, XCircle } from 'lucide-react';
import { Card } from '../../../core/components/Card';
import { Select } from '../../../core/components/Select';
import type { SelectOption } from '../../../core/components/Select';
import { ViewSwitcher } from '../../../core/components/ViewSwitcher';
import type { ViewOption } from '../../../core/components/ViewSwitcher';
import { AlbumRequestsSection } from '../../album/components/AlbumRequestsSection';
import { ArtistRequestsSection } from '../../artist/components/ArtistRequestsSection';
import { SongRequestsSection } from '../../song/components/SongRequestsSection';

// Las tres entidades aportables. `singular` y `plural` se usan para armar los
// textos del estado vacío sin que queden frases mal construidas en castellano
// ("un artista" / "un álbum" / "una canción").
const REQUEST_ENTITIES = [
  { id: 'artists', label: 'Artistas', icon: Mic2, singular: 'un artista', plural: 'artistas' },
  { id: 'albums', label: 'Álbumes', icon: Disc3, singular: 'un álbum', plural: 'álbumes' },
  { id: 'songs', label: 'Canciones', icon: Music, singular: 'una canción', plural: 'canciones' },
] as const;

type RequestEntityId = (typeof REQUEST_ENTITIES)[number]['id'];

// Los ids son los mismos valores del enum CONTENT_STATES del backend, más 'all',
// que no filtra por estado y muestra la cola completa de esa entidad.
const REQUEST_FILTERS = [
  { id: 'all', label: 'Todas', icon: Inbox },
  { id: 'pending', label: 'Pendientes', icon: Clock },
  { id: 'approved', label: 'Aprobadas', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rechazadas', icon: XCircle },
] as const;

type RequestFilterId = (typeof REQUEST_FILTERS)[number]['id'];

// Lo que esperan los dos controles: value + label. El resto de los datos (íconos
// y palabras para los textos) no les hace falta.
const ENTITY_OPTIONS: ViewOption<RequestEntityId>[] = REQUEST_ENTITIES.map(({ id, label }) => ({
  value: id,
  label,
}));

const FILTER_OPTIONS: SelectOption<RequestFilterId>[] = REQUEST_FILTERS.map(({ id, label }) => ({
  value: id,
  label,
}));

type Entity = (typeof REQUEST_ENTITIES)[number];

/**
 * Arma el título y el mensaje del estado vacío.
 *
 * Dependen de las dos cosas elegidas: de qué entidad se está mirando y en qué
 * estado. "No hay álbumes pendientes" y "Todavía no rechazaste ningún aporte de
 * canciones" no se explican igual.
 *
 * @param entity entidad elegida en el primer selector.
 * @param filter estado elegido en el segundo.
 */
function buildEmptyCopy(entity: Entity, filter: RequestFilterId): { title: string; message: string } {
  switch (filter) {
    case 'all':
      return {
        title: `Todavía no hay aportes de ${entity.plural}.`,
        message: `Cuando un usuario Pro cargue ${entity.singular}, su aporte va a aparecer acá para que lo revises.`,
      };
    case 'pending':
      return {
        title: `No hay solicitudes de ${entity.plural} pendientes.`,
        message: `Cuando un usuario Pro cargue ${entity.singular}, su aporte va a aparecer acá para que lo apruebes o lo rechaces.`,
      };
    case 'approved':
      return {
        title: `Todavía no aprobaste ningún aporte de ${entity.plural}.`,
        message: 'Lo que apruebes pasa a ser visible y reseñable por toda la comunidad.',
      };
    case 'rejected':
      return {
        title: `Todavía no rechazaste ningún aporte de ${entity.plural}.`,
        message: 'Lo rechazado no se borra: queda registrado para poder revisarlo más adelante.',
      };
  }
}

export const AdminRequestsPanel = () => {
  const [activeEntity, setActiveEntity] = useState<RequestEntityId>('artists');
  const [activeFilter, setActiveFilter] = useState<RequestFilterId>('pending');

  // Los `!` son seguros: los dos estados solo pueden tomar los ids de sus propias
  // listas.
  const entity = REQUEST_ENTITIES.find((item) => item.id === activeEntity)!;
  const filter = REQUEST_FILTERS.find((item) => item.id === activeFilter)!;
  const Icon = filter.icon;

  const emptyCopy = buildEmptyCopy(entity, activeFilter);

  // Las tres colas reciben lo mismo, así que se arma una sola vez.
  const sectionProps = {
    state: activeFilter,
    emptyIcon: <Icon size={22} />,
    emptyTitle: emptyCopy.title,
    emptyMessage: emptyCopy.message,
  };

  return (
    <Card
      title="Solicitudes de usuarios Pro"
      subtitle="Aportes al catálogo enviados por miembros Pro, a la espera de tu revisión."
    >
      {/* Qué se está moderando: el mismo conmutador que /music y el ABM del
          catálogo, porque cambia la cola entera y no filtra la que se ve. */}
      <div className="admin-panel__switcher">
        <ViewSwitcher
          options={ENTITY_OPTIONS}
          value={activeEntity}
          // Va envuelto y no como `setActiveEntity` a secas: el tipo que espera un
          // setter de useState admite también una función, y con eso TypeScript no
          // logra deducir cuál es el tipo de las opciones.
          onChange={(id) => setActiveEntity(id)}
          ariaLabel="Entidad del catálogo"
          // Va dentro de una tarjeta: la caja del conmutador toma el color del
          // fondo de la sección para despegarse de ella.
          tone="sunken"
        />
      </div>

      {/* Y acá el filtro de esa cola: acota lo que se lista sin cambiar de
          pantalla. Es un <span> y no un <label>: el desplegable propio es un
          botón, y un label envolviéndolo no lo describiría como sí lo hace su
          aria-label (mismo criterio que las tablas de la pestaña "Música"). */}
      <span className="admin-panel__filter">
        Estado
        <Select
          options={FILTER_OPTIONS}
          value={activeFilter}
          onChange={(id) => setActiveFilter(id)}
          ariaLabel="Filtrar las solicitudes por estado"
          size="sm"
        />
      </span>

      {/* La key remonta la sección al cambiar de entidad o de estado: así el aviso
          de la última decisión ("se aprobó X") no queda colgado sobre otra lista. */}
      {activeEntity === 'artists' ? (
        <ArtistRequestsSection key={`artists-${activeFilter}`} {...sectionProps} />
      ) : activeEntity === 'albums' ? (
        <AlbumRequestsSection key={`albums-${activeFilter}`} {...sectionProps} />
      ) : (
        <SongRequestsSection key={`songs-${activeFilter}`} {...sectionProps} />
      )}
    </Card>
  );
};
