// Tarjeta de una propuesta de artista dentro de la cola de solicitudes: quién la
// mandó, qué propuso y los botones para resolverla.
//
// Es presentacional: no llama a la API ni guarda estado; avisa al padre
// (ArtistRequestsSection) con onApprove / onReject.
import { CheckCircle2, UserRound, XCircle } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { STATE_LABELS, STATE_TONES } from '../models/Artist';
import type { Artist } from '../models/Artist';
import '../styles/_artist.scss';

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
    <li className="artist-request">
      <div className="artist-request__head">
        <h4 className="artist-request__name">{artist.name}</h4>
        <Badge tone={STATE_TONES[artist.state]}>{STATE_LABELS[artist.state]}</Badge>
      </div>

      <p className="artist-request__author">
        <UserRound size={14} aria-hidden="true" />
        Propuesto por {artist.creatorName}
      </p>

      {artist.biography ? (
        <p className="artist-request__bio">{artist.biography}</p>
      ) : (
        <p className="artist-request__bio artist-request__bio--empty">
          El aporte no incluye una biografía.
        </p>
      )}

      <div className="artist-request__actions">
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
      </div>
    </li>
  );
};
