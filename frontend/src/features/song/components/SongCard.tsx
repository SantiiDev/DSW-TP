// Card de una canción aportada: su título, dónde está (álbum y artista) y su
// duración. La usa el listado de aportes del perfil.
//
// Es una fila y no una tarjeta con imagen, a diferencia de AlbumCard: una canción
// no tiene portada propia, así que lo único que la identifica es el texto.
//
// Si la canción ya está aprobada, la card lleva a su ficha. Las pendientes y las
// rechazadas no: todavía no forman parte del catálogo público y la ficha responde
// 404 sobre ellas.
import { Link } from 'react-router-dom';
import { Badge } from '../../../core/components/Badge';
import { STATE_LABELS, STATE_TONES } from '../models/Song';
import type { Song } from '../models/Song';
import '../styles/_song.scss';

type SongCardProps = {
  song: Song;
  /**
   * Muestra el estado de moderación. Se activa en los aportes propios: es el dato
   * que le dice al autor si su propuesta ya se aprobó.
   */
  showState?: boolean;
};

export const SongCard = ({ song, showState = false }: SongCardProps) => {
  const content = (
    <>
      <div className="song-card__info">
        <h4 className="song-card__title">{song.title}</h4>
        <p className="song-card__location">{song.locationLabel}</p>
      </div>

      <div className="song-card__meta">
        <span className="song-card__duration">{song.durationLabel}</span>
        {showState && <Badge tone={STATE_TONES[song.state]}>{STATE_LABELS[song.state]}</Badge>}
      </div>
    </>
  );

  if (!song.isApproved) {
    return <article className="song-card">{content}</article>;
  }

  return (
    <Link className="song-card song-card--link" to={`/songs/${song.id}`}>
      {content}
    </Link>
  );
};
