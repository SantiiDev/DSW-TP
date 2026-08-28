// Cola de propuestas de álbumes de la pestaña "Solicitudes" del panel de
// administración: lo que cargaron los usuarios Pro, para que un ADMIN lo apruebe
// o lo rechace.
//
// Pide el listado con contributed=true, así quedan afuera los álbumes del
// catálogo inicial: esos no los propuso nadie y no son solicitudes.
//
// Vive en la feature album para que el panel (AdminRequestsPanel) solo tenga que
// montarla, y recibe el estado vacío como props para no duplicar los textos que
// esa pestaña ya define. Es la hermana de ArtistRequestsSection.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { albumService } from '../services/albumService';
import type { Album, ContentState } from '../models/Album';
import { AlbumRequestCard } from './AlbumRequestCard';

type AlbumRequestsSectionProps = {
  /** Estado de las solicitudes a mostrar; lo elige el selector de la pestaña. */
  state: ContentState;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
};

/** Cómo se llama cada decisión ya tomada, para el mensaje de confirmación. */
const DECISION_LABELS: Record<'approve' | 'reject', string> = {
  approve: 'aprobó',
  reject: 'rechazó',
};

export const AlbumRequestsSection = ({
  state,
  emptyIcon,
  emptyTitle,
  emptyMessage,
}: AlbumRequestsSectionProps) => {
  const {
    data,
    isLoading,
    error,
    reload: loadRequests,
    setError,
  } = useFetch(() => albumService.list({ state, contributed: true }), state);
  const requests = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  // Solicitud con una operación en curso: deshabilita solo sus botones.
  const [busyAlbumId, setBusyAlbumId] = useState<number | null>(null);

  /**
   * Resuelve una solicitud.
   * @param album álbum propuesto.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleDecision = async (album: Album, decision: 'approve' | 'reject') => {
    setBusyAlbumId(album.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await albumService.approve(album.id);
      else await albumService.reject(album.id);

      // Al resolverla cambia de estado, así que sale de la lista que se está
      // mirando: se recarga para que la cola quede como corresponde.
      await loadRequests();
      setFeedback(`Se ${DECISION_LABELS[decision]} la propuesta "${album.title}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAlbumId(null);
    }
  };

  return (
    <div className="request-section">
      {error && <Alert tone="error">{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {isLoading ? (
        <Loader message="Cargando solicitudes..." />
      ) : requests.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          <h3 className="request-section__title">Álbumes ({requests.length})</h3>

          <ul className="request-list">
            {requests.map((album) => (
              <AlbumRequestCard
                key={album.id}
                album={album}
                isBusy={busyAlbumId === album.id}
                onApprove={(item) => void handleDecision(item, 'approve')}
                onReject={(item) => void handleDecision(item, 'reject')}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
