// Pestaña "Solicitudes" del panel de administración: la cola de moderación de
// los aportes al catálogo que hacen los usuarios Pro (CUU 3 de la propuesta).
//
// Cuando un usuario Pro carga un artista, un álbum o una canción, el registro
// entra con state = 'pending' y no lo ve nadie más hasta que un ADMIN lo aprueba
// o lo rechaza desde acá. Los tres filtros son justamente esos estados.
//
// Las propuestas de artistas ya salen de la API, en la sección que aporta la
// feature artist; los álbumes y las canciones se suman cuando existan sus
// endpoints. Si no hay ninguna solicitud en el estado elegido, se sigue mostrando
// el estado vacío de ese filtro, que es de dónde salen los textos que recibe la
// sección.
import { useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ArtistRequestsSection } from '../../artist/components/ArtistRequestsSection';

// Los ids son los mismos valores del enum CONTENT_STATES del backend.
const REQUEST_FILTERS = [
  {
    id: 'pending',
    label: 'Pendientes',
    icon: Clock,
    title: 'No hay solicitudes pendientes.',
    message:
      'Cuando un usuario Pro cargue un artista, un álbum o una canción, su aporte va a aparecer acá para que lo apruebes o lo rechaces.',
  },
  {
    id: 'approved',
    label: 'Aprobadas',
    icon: CheckCircle2,
    title: 'Todavía no aprobaste ningún aporte.',
    message: 'Lo que apruebes pasa a ser visible y reseñable por toda la comunidad.',
  },
  {
    id: 'rejected',
    label: 'Rechazadas',
    icon: XCircle,
    title: 'Todavía no rechazaste ningún aporte.',
    message: 'Lo rechazado no se borra: queda registrado para poder revisarlo más adelante.',
  },
] as const;

type RequestFilterId = (typeof REQUEST_FILTERS)[number]['id'];

export const AdminRequestsPanel = () => {
  const [activeFilter, setActiveFilter] = useState<RequestFilterId>('pending');

  // El `!` es seguro: activeFilter solo puede tomar los ids de la propia lista.
  const filter = REQUEST_FILTERS.find((item) => item.id === activeFilter)!;
  const Icon = filter.icon;

  return (
    <section className="admin-panel__block">
      <header className="admin-panel__block-header">
        <h2 className="admin-panel__block-title">Solicitudes de usuarios Pro</h2>
        <p className="admin-panel__block-subtitle">
          Aportes al catálogo enviados por miembros Pro, a la espera de tu revisión.
        </p>
      </header>

      <div className="admin-panel__segments" role="group" aria-label="Estado de la solicitud">
        {REQUEST_FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`admin-panel__segment ${
              activeFilter === id ? 'admin-panel__segment--active' : ''
            }`}
            aria-pressed={activeFilter === id}
            onClick={() => setActiveFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <ArtistRequestsSection
        state={activeFilter}
        emptyIcon={<Icon size={22} />}
        emptyTitle={filter.title}
        emptyMessage={filter.message}
      />
    </section>
  );
};
