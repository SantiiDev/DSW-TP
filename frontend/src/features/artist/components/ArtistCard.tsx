// Card de un artista: su nombre, un adelanto de la biografía y cuántos álbumes
// tiene cargados. La usa el listado de aportes del perfil.
//
// No navega a ningún lado: la ficha del artista se ve desde el panel de
// administración, que es donde se lo administra.
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { IconButton } from '../../../core/components/IconButton';
import { STATE_LABELS, STATE_TONES } from '../models/Artist';
import type { Artist } from '../models/Artist';
import '../styles/_artist.scss';

type ArtistCardProps = {
  artist: Artist;
  /**
   * Muestra el estado de moderación. Se activa en los aportes propios: es el dato
   * que le dice al autor si su propuesta ya se aprobó.
   */
  showState?: boolean;
  /** true mientras este aporte tiene una operación en curso. */
  isBusy?: boolean;
  /**
   * Acciones del autor sobre su propio aporte. Si no se pasan, la card no dibuja
   * la fila de botones: es lo que pasa en el perfil de otro usuario y en los
   * aportes ya aprobados, que son catálogo público y solo toca un ADMIN.
   */
  onEdit?: (artist: Artist) => void;
  onDelete?: (artist: Artist) => void;
};

export const ArtistCard = ({
  artist,
  showState = false,
  isBusy = false,
  onEdit,
  onDelete,
}: ArtistCardProps) => {
  return (
    <article className="artist-card">
      <h3 className="artist-card__name">{artist.name}</h3>

      {artist.biography ? (
        <p className="artist-card__bio">{artist.biography}</p>
      ) : (
        <p className="artist-card__bio artist-card__bio--empty">Todavía no tiene biografía.</p>
      )}

      <div className="artist-card__meta">
        <span className="artist-card__albums">{artist.albumsLabel}</span>

        {showState && (
          <Badge tone={STATE_TONES[artist.state]}>{STATE_LABELS[artist.state]}</Badge>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="artist-card__actions">
          {onEdit && (
            <IconButton
              icon={<Pencil size={16} />}
              label="Editar la propuesta"
              disabled={isBusy}
              onClick={() => onEdit(artist)}
            />
          )}

          {onDelete && (
            <IconButton
              icon={<Trash2 size={16} />}
              label="Eliminar la propuesta"
              tone="danger"
              disabled={isBusy}
              onClick={() => onDelete(artist)}
            />
          )}
        </div>
      )}
    </article>
  );
};
