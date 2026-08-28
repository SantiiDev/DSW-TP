// Tarjeta de una propuesta de canción dentro de la cola de solicitudes: quién la
// mandó, qué propuso y los botones para resolverla.
//
// El marco lo pone RequestCard (core/components), el mismo que usan las
// solicitudes de artista y de álbum; acá va solo el detalle propio de la canción:
// a qué álbum pertenece, en qué pista y cuánto dura.
//
// Es presentacional: no llama a la API ni guarda estado; avisa al padre
// (SongRequestsSection) con onApprove / onReject.
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { RequestCard } from '../../../core/components/RequestCard';
import { STATE_LABELS, STATE_TONES } from '../models/Song';
import type { Song } from '../models/Song';

type SongRequestCardProps = {
  song: Song;
  /** true mientras esta solicitud tiene una operación en curso. */
  isBusy: boolean;
  onApprove: (song: Song) => void;
  onReject: (song: Song) => void;
};

export const SongRequestCard = ({ song, isBusy, onApprove, onReject }: SongRequestCardProps) => {
  // Cada estado ofrece la decisión que le falta: una solicitud pendiente se puede
  // resolver para cualquiera de los dos lados, y una ya resuelta solo se puede
  // dar vuelta. Rechazar no borra nada, así que siempre se puede volver atrás.
  const canApprove = song.state !== 'approved';
  const canReject = song.state !== 'rejected';

  return (
    <RequestCard
      title={song.title}
      badge={<Badge tone={STATE_TONES[song.state]}>{STATE_LABELS[song.state]}</Badge>}
      author={song.creatorName}
      actions={
        <>
          {canApprove && (
            <Button variant="success" disabled={isBusy} onClick={() => onApprove(song)}>
              <CheckCircle2 size={16} aria-hidden="true" />
              {song.state === 'pending' ? 'Aprobar' : 'Aprobar igual'}
            </Button>
          )}

          {canReject && (
            <Button variant="danger" disabled={isBusy} onClick={() => onReject(song)}>
              <XCircle size={16} aria-hidden="true" />
              {song.state === 'pending' ? 'Rechazar' : 'Dar de baja'}
            </Button>
          )}
        </>
      }
    >
      {/* Álbum y artista: hay muchísimos títulos repetidos entre álbumes distintos
          ("Intro"), así que sin esto no se sabe qué se está aprobando. */}
      <p className="request-card__detail">{song.locationLabel}</p>

      <p className="request-card__detail">
        Pista {song.numberTrack} · {song.durationLabel}
      </p>
    </RequestCard>
  );
};
