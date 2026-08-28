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
import { Badge } from '../../../core/components/Badge';
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
};

export const AlbumCard = ({ album, showState = false }: AlbumCardProps) => {
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
    return <article className="album-card">{content}</article>;
  }

  return (
    <Link className="album-card album-card--link" to={`/albums/${album.id}`}>
      {content}
    </Link>
  );
};
