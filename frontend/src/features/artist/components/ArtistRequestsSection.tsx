// Cola de propuestas de artistas de la pestaña "Solicitudes" del panel de
// administración: lo que cargaron los usuarios Pro, para que un ADMIN lo apruebe
// o lo rechace.
//
// Pide el listado con contributed=true, así quedan afuera los artistas del
// catálogo inicial: esos no los propuso nadie y no son solicitudes.
//
// Vive en la feature artist para que el panel (AdminRequestsPanel) solo tenga que
// montarla, y recibe el estado vacío como props para no duplicar los textos que
// esa pestaña ya define.
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Loader } from '../../../core/components/Loader';
import { EmptyState } from '../../../core/components/EmptyState';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { artistService } from '../services/artistService';
import type { Artist, ContentState } from '../models/Artist';
import { ArtistRequestCard } from './ArtistRequestCard';
import '../styles/_artist.scss';

type ArtistRequestsSectionProps = {
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

export const ArtistRequestsSection = ({
  state,
  emptyIcon,
  emptyTitle,
  emptyMessage,
}: ArtistRequestsSectionProps) => {
  const [requests, setRequests] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  // Solicitud con una operación en curso: deshabilita solo sus botones.
  const [busyArtistId, setBusyArtistId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Al cambiar de pestaña se limpia el aviso de la decisión anterior: hablaba de
    // otra lista. En una decisión no molesta, porque el aviso se vuelve a poner
    // después de recargar.
    setFeedback(null);

    try {
      setRequests(await artistService.list({ state, contributed: true }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  /**
   * Resuelve una solicitud.
   * @param artist artista propuesto.
   * @param decision qué se decidió sobre el aporte.
   */
  const handleDecision = async (artist: Artist, decision: 'approve' | 'reject') => {
    setBusyArtistId(artist.id);
    setError(null);
    setFeedback(null);

    try {
      if (decision === 'approve') await artistService.approve(artist.id);
      else await artistService.reject(artist.id);

      // Al resolverla cambia de estado, así que sale de la lista que se está
      // mirando: se recarga para que la cola quede como corresponde.
      await loadRequests();
      setFeedback(`Se ${DECISION_LABELS[decision]} la propuesta "${artist.name}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyArtistId(null);
    }
  };

  return (
    <div className="artist-requests">
      {error && (
        <p className="artist-requests__error" role="alert">
          {error}
        </p>
      )}

      {feedback && (
        <p className="artist-requests__feedback" role="status">
          {feedback}
        </p>
      )}

      {isLoading ? (
        <Loader message="Cargando solicitudes..." />
      ) : requests.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          <h3 className="artist-requests__title">
            Artistas ({requests.length})
          </h3>

          <ul className="artist-requests__list">
            {requests.map((artist) => (
              <ArtistRequestCard
                key={artist.id}
                artist={artist}
                isBusy={busyArtistId === artist.id}
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
