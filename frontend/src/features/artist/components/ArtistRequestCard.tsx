// Tarjeta de una propuesta de artista dentro de la cola de solicitudes: quién la
// mandó, qué propuso y los botones para resolverla.
//
// El marco lo pone RequestCard (core/components), el mismo que usan las
// solicitudes de álbum y de canción; acá va solo el detalle propio del artista,
// que es su biografía.
//
// Es presentacional: no llama a la API ni guarda estado; avisa al padre
// (ArtistRequestsSection) con onApprove / onReject.
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { RequestCard } from '../../../core/components/RequestCard';
import { STATE_LABELS, STATE_TONES } from '../models/Artist';
import type { Artist } from '../models/Artist';

type ArtistRequestCardProps = {
  artist: Artist;
  /** true mientras esta solicitud tiene una operación en curso. */
  isBusy: boolean;
  onApprove: (artist: Artist) => void;
  onReject: (artist: Artist) => void;
};

export const ArtistRequestCard = ({
  artist,
  isBusy,
  onApprove,
  onReject,
}: ArtistRequestCardProps) => {
  // Cada estado ofrece la decisión que le falta: una solicitud pendiente se puede
  // resolver para cualquiera de los dos lados, y una ya resuelta solo se puede
  // dar vuelta. Rechazar no borra nada, así que siempre se puede volver atrás.
  const canApprove = artist.state !== 'approved';
  const canReject = artist.state !== 'rejected';

  return (
    <RequestCard
      title={artist.name}
      badge={<Badge tone={STATE_TONES[artist.state]}>{STATE_LABELS[artist.state]}</Badge>}
      author={artist.creatorName}
      actions={
        <>
          {canApprove && (
            <Button variant="success" disabled={isBusy} onClick={() => onApprove(artist)}>
              <CheckCircle2 size={16} aria-hidden="true" />
              {artist.state === 'pending' ? 'Aprobar' : 'Aprobar igual'}
            </Button>
          )}

          {canReject && (
            <Button variant="danger" disabled={isBusy} onClick={() => onReject(artist)}>
              <XCircle size={16} aria-hidden="true" />
              {artist.state === 'pending' ? 'Rechazar' : 'Dar de baja'}
            </Button>
          )}
        </>
      }
    >
      {artist.biography ? (
        <p className="request-card__detail">{artist.biography}</p>
      ) : (
        <p className="request-card__detail request-card__detail--empty">
          El aporte no incluye una biografía.
        </p>
      )}
    </RequestCard>
  );
};
