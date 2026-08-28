// Cola de propuestas de canciones de la pestaña "Solicitudes" del panel de
// administración: lo que cargaron los usuarios Pro, para que un ADMIN lo apruebe
// o lo rechace.
//
// Pide el listado con contributed=true, así quedan afuera las canciones del
// catálogo inicial: esas no las propuso nadie y no son solicitudes.
//
// Vive en la feature song para que el panel (AdminRequestsPanel) solo tenga que
// montarla, y recibe el estado vacío como props para no duplicar los textos que
// esa pestaña ya define. Es la hermana de ArtistRequestsSection.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { useFetch } from '../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { songService } from '../services/songService';
import type { ContentState, Song } from '../models/Song';
import { SongRequestCard } from './SongRequestCard';

type SongRequestsSectionProps = {
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

export const SongRequestsSection = ({
  state,
  emptyIcon,
  emptyTitle,
  emptyMessage,
}: SongRequestsSectionProps) => {
  const {
    data,
    isLoading,
    error,
    reload: loadRequests,
    setError,
  } = useFetch(() => songService.list({ state, contributed: true }), state);
  const requests = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  // Solicitud con una operación en curso: deshabilita solo sus botones.
  const [busySongId, setBusySongId] = useState<number | null>(null);

  /**
   * Resuelve una solicitud.
   * @param song canción propuesta.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleDecision = async (song: Song, decision: 'approve' | 'reject') => {
    setBusySongId(song.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await songService.approve(song.id);
      else await songService.reject(song.id);

      // Al resolverla cambia de estado, así que sale de la lista que se está
      // mirando: se recarga para que la cola quede como corresponde.
      await loadRequests();
      setFeedback(`Se ${DECISION_LABELS[decision]} la propuesta "${song.title}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusySongId(null);
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
          <h3 className="request-section__title">Canciones ({requests.length})</h3>

          <ul className="request-list">
            {requests.map((song) => (
              <SongRequestCard
                key={song.id}
                song={song}
                isBusy={busySongId === song.id}
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
