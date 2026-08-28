// Tarjeta de una propuesta de álbum dentro de la cola de solicitudes: quién la
// mandó, qué propuso y los botones para resolverla.
//
// El marco lo pone RequestCard (core/components), el mismo que usan las
// solicitudes de artista y de canción; acá va solo el detalle propio del álbum:
// de quién es, de qué año, con qué géneros y cuántas pistas tiene cargadas.
//
// Es presentacional: no llama a la API ni guarda estado; avisa al padre
// (AlbumRequestsSection) con onApprove / onReject.
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { RequestCard } from '../../../core/components/RequestCard';
import { STATE_LABELS, STATE_TONES } from '../models/Album';
import type { Album } from '../models/Album';

type AlbumRequestCardProps = {
  album: Album;
  /** true mientras esta solicitud tiene una operación en curso. */
  isBusy: boolean;
  onApprove: (album: Album) => void;
  onReject: (album: Album) => void;
};

export const AlbumRequestCard = ({
  album,
  isBusy,
  onApprove,
  onReject,
}: AlbumRequestCardProps) => {
  // Cada estado ofrece la decisión que le falta: una solicitud pendiente se puede
  // resolver para cualquiera de los dos lados, y una ya resuelta solo se puede
  // dar vuelta. Rechazar no borra nada, así que siempre se puede volver atrás.
  const canApprove = album.state !== 'approved';
  const canReject = album.state !== 'rejected';

  return (
    <RequestCard
      title={album.title}
      badge={<Badge tone={STATE_TONES[album.state]}>{STATE_LABELS[album.state]}</Badge>}
      author={album.creatorName}
      actions={
        <>
          {canApprove && (
            <Button variant="success" disabled={isBusy} onClick={() => onApprove(album)}>
              <CheckCircle2 size={16} aria-hidden="true" />
              {album.state === 'pending' ? 'Aprobar' : 'Aprobar igual'}
            </Button>
          )}

          {canReject && (
            <Button variant="danger" disabled={isBusy} onClick={() => onReject(album)}>
              <XCircle size={16} aria-hidden="true" />
              {album.state === 'pending' ? 'Rechazar' : 'Dar de baja'}
            </Button>
          )}
        </>
      }
    >
      {/* Artista y año: es lo que hay que mirar para decidir si el álbum ya está
          en el catálogo cargado con otro nombre. */}
      <p className="request-card__detail">
        {album.artistName} · {album.yearLabel}
      </p>

      <p className="request-card__detail">{album.genresLabel}</p>

      {/* Cuántas pistas trae: un álbum propuesto sin canciones se aprueba igual,
          pero conviene saberlo antes de publicarlo. */}
      <p className="request-card__detail">{album.songsLabel}</p>
    </RequestCard>
  );
};
