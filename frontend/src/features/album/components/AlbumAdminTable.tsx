// Tabla de álbumes del panel de administración: muestra el catálogo con su
// estado de moderación y los botones de editar, eliminar y aprobar/rechazar.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de artistas, géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AlbumAdminSection) con los handlers que recibe.
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { STATE_LABELS, STATE_TONES } from '../models/Album';
import type { Album } from '../models/Album';

type AlbumAdminTableProps = {
  albums: Album[];
  /** Id del usuario logueado: decide qué aportes propios puede editar. */
  currentUserId: number;
  isAdmin: boolean;
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busyAlbumId: number | null;
  onEdit: (album: Album) => void;
  onDelete: (album: Album) => void;
  onApprove: (album: Album) => void;
  onReject: (album: Album) => void;
};

export const AlbumAdminTable = ({
  albums,
  currentUserId,
  isAdmin,
  busyAlbumId,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: AlbumAdminTableProps) => {
  const columns: DataTableColumn<Album>[] = [
    {
      key: 'title',
      header: 'Álbum',
      render: (album) => (
        <span className="data-table__name-cell data-table__name-cell--stacked">
          {album.title}
          {/* Artista y géneros en una sola línea: es lo que distingue dos álbumes
              con el mismo título en la tabla. */}
          <span className="data-table__hint">
            {album.artistName} · {album.genresLabel}
          </span>
        </span>
      ),
    },
    {
      key: 'year',
      header: 'Año',
      render: (album) => album.yearLabel,
    },
    {
      key: 'songs',
      header: 'Canciones',
      render: (album) => album.songsCount,
    },
    {
      key: 'state',
      header: 'Estado',
      render: (album) => (
        <Badge tone={STATE_TONES[album.state]}>{STATE_LABELS[album.state]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (album) => {
        const isBusy = busyAlbumId === album.id;
        const canEdit = album.canBeEditedBy(currentUserId, isAdmin);

        return (
          <div className="data-table__actions">
            {canEdit && (
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => onEdit(album)}>
                Editar
              </Button>
            )}

            {/* La moderación es exclusiva del ADMIN, y solo tiene sentido sobre
                un aporte que todavía nadie revisó. */}
            {isAdmin && album.isPending && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onApprove(album)}
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onReject(album)}
                >
                  Rechazar
                </Button>
              </>
            )}

            {isAdmin && (
              <Button variant="danger" size="sm" disabled={isBusy} onClick={() => onDelete(album)}>
                Eliminar
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    // align="top" porque la primera columna tiene dos líneas (título y artista) y
    // el resto se leería descolgado si quedara centrado.
    <DataTable columns={columns} rows={albums} getRowKey={(album) => album.id} align="top" />
  );
};
