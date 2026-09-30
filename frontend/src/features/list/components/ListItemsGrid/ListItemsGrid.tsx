// Grilla con los ítems de una lista, en su orden, o el aviso de que todavía no
// tiene ninguno.
//
// Cada tarjeta es solo el enlace a la ficha del ítem —del álbum o de la canción,
// según el tipo de la lista—: sacarlo se hace desde "Administrar". Reusa las
// tarjetas de la ficha de un género (album-collection / album-item).
import { ListMusic } from 'lucide-react';
import { EmptyState } from '../../../../core/components/EmptyState';
import { GatedLink } from '../../../../core/components/GatedLink';
import { AlbumCover } from '../../../genre/components/AlbumCover';
import type { List } from '../../models/List';
import '../../../genre/components/GenreAlbumList/GenreAlbumList.scss';

type ListItemsGridProps = {
  list: List;
  /** Cambia el texto del estado vacío: al dueño Pro se lo invita a sumar ítems. */
  canManage: boolean;
};

export const ListItemsGrid = ({ list, canManage }: ListItemsGridProps) => {
  if (list.items.length === 0) {
    return (
      <EmptyState
        icon={<ListMusic size={22} />}
        title={
          list.isSongList
            ? 'Esta lista todavía no tiene canciones.'
            : 'Esta lista todavía no tiene álbumes.'
        }
        message={
          canManage
            ? 'Usá el botón de arriba para empezar a sumarlas.'
            : 'Su dueño todavía no le agregó ninguna.'
        }
      />
    );
  }

  return (
    <ul className="album-collection album-collection--grid">
      {list.items.map((item) => (
        <li key={item.id}>
          <GatedLink to={item.path} className="album-item">
            <AlbumCover title={item.title} url={item.urlCover} size="lg" />
            <div className="album-item__info">
              <p className="album-item__title">{item.title}</p>
              <p className="album-item__artist">{item.artistName}</p>
              {item.releaseYear !== null && <p className="album-item__year">{item.releaseYear}</p>}
            </div>
          </GatedLink>
        </li>
      ))}
    </ul>
  );
};
