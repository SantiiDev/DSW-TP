// Pestaña "Solicitudes" del panel de administración: la cola de moderación de
// los aportes al catálogo que hacen los usuarios Pro (CUU 3 de la propuesta).
//
// Cuando un usuario Pro carga un artista, un álbum o una canción, el registro
// entra con state = 'pending' y no lo ve nadie más hasta que un ADMIN lo aprueba
// o lo rechaza desde acá.
//
// Hay DOS selectores, uno arriba del otro:
//   1. qué entidad se está moderando (artistas, álbumes o canciones),
//   2. en qué estado están las solicitudes de esa entidad.
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
import { CheckCircle2, Clock, Disc3, Mic2, Music, XCircle } from 'lucide-react';
import { Card } from '../../../core/components/Card';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import type { SegmentOption } from '../../../core/components/SegmentedControl';
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

// Los ids son los mismos valores del enum CONTENT_STATES del backend.
const REQUEST_FILTERS = [
  { id: 'pending', label: 'Pendientes', icon: Clock },
  { id: 'approved', label: 'Aprobadas', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rechazadas', icon: XCircle },
] as const;

type RequestFilterId = (typeof REQUEST_FILTERS)[number]['id'];

// Lo que esperan los selectores de segmentos: value + label. El resto de los
// datos (íconos y palabras para los textos) no les hace falta.
const ENTITY_OPTIONS: SegmentOption<RequestEntityId>[] = REQUEST_ENTITIES.map(({ id, label }) => ({
  value: id,
  label,
}));

const FILTER_OPTIONS: SegmentOption<RequestFilterId>[] = REQUEST_FILTERS.map(({ id, label }) => ({
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
      <SegmentedControl
        options={ENTITY_OPTIONS}
        value={activeEntity}
        // Va envuelto y no como `setActiveEntity` a secas: el tipo que espera un
        // setter de useState admite también una función, y con eso TypeScript no
        // logra deducir cuál es el tipo de las opciones.
        onChange={(id) => setActiveEntity(id)}
        ariaLabel="Entidad del catálogo"
      />

      <SegmentedControl
        options={FILTER_OPTIONS}
        value={activeFilter}
        onChange={(id) => setActiveFilter(id)}
        ariaLabel="Estado de la solicitud"
      />

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
