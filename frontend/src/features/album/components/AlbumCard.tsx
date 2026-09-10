// Card de un álbum: su portada, su título, el artista, el año y cuántas
// canciones tiene cargadas. La usa el listado de aportes del perfil.
//
// Si el álbum ya está aprobado, la card lleva a su ficha. Los pendientes y los
// rechazados no: todavía no forman parte del catálogo público y la ficha
// responde 404 sobre ellos.
//
// La portada la dibuja AlbumCover, de la feature genre: es el mismo componente
// que usa la ficha del género, con su reserva por si el álbum no tiene imagen.
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { IconButton } from '../../../core/components/IconButton';
import { AlbumCover } from '../../genre/components/AlbumCover';
import { STATE_LABELS, STATE_TONES } from '../models/Album';
import type { Album } from '../models/Album';
import '../styles/_album.scss';

type AlbumCardProps = {
  album: Album;
  /**
   * Muestra el estado de moderación. Se activa en los aportes propios: es el dato
   * que le dice al autor si su propuesta ya se aprobó.
   */
  showState?: boolean;
  /** true mientras este aporte tiene una operación en curso. */
  isBusy?: boolean;
  /**
   * Acciones del autor sobre su propio aporte. Solo llegan en los aportes que
   * todavía no se aprobaron: uno aprobado ya es catálogo público, la card es un
   * enlace a su ficha y no puede llevar botones adentro.
   */
  onEdit?: (album: Album) => void;
  onDelete?: (album: Album) => void;
};

export const AlbumCard = ({
  album,
  showState = false,
  isBusy = false,
  onEdit,
  onDelete,
}: AlbumCardProps) => {
  const content = (
    <>
      <AlbumCover title={album.title} url={album.urlCover} size="lg" />

      <div className="album-card__body">
        <h4 className="album-card__title">{album.title}</h4>
        <p className="album-card__artist">{album.artistName}</p>
        <p className="album-card__meta">
          {album.yearLabel} · {album.songsLabel}
        </p>

        {showState && (
          <Badge tone={STATE_TONES[album.state]}>{STATE_LABELS[album.state]}</Badge>
        )}
      </div>
    </>
  );

  if (!album.isApproved) {
    return (
      <article className="album-card">
        {content}

        {(onEdit || onDelete) && (
          <div className="album-card__actions">
            {onEdit && (
              <IconButton
                icon={<Pencil size={16} />}
                label="Editar la propuesta"
                disabled={isBusy}
                onClick={() => onEdit(album)}
              />
            )}

            {onDelete && (
              <IconButton
                icon={<Trash2 size={16} />}
                label="Eliminar la propuesta"
                tone="danger"
                disabled={isBusy}
                onClick={() => onDelete(album)}
              />
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <Link className="album-card album-card--link" to={`/albums/${album.id}`}>
      {content}
    </Link>
  );
};
