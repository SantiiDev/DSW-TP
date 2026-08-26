// Tabla de artistas del panel de administración: muestra el catálogo con su
// estado de moderación y los botones de editar, eliminar y aprobar/rechazar.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (ArtistAdminSection) con los handlers que recibe.
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { STATE_LABELS, STATE_TONES } from '../models/Artist';
import type { Artist } from '../models/Artist';

type ArtistAdminTableProps = {
  artists: Artist[];
  /** Id del usuario logueado: decide qué aportes propios puede editar. */
  currentUserId: number;
  isAdmin: boolean;
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busyArtistId: number | null;
  onEdit: (artist: Artist) => void;
  onDelete: (artist: Artist) => void;
  onApprove: (artist: Artist) => void;
  onReject: (artist: Artist) => void;
};

export const ArtistAdminTable = ({
  artists,
  currentUserId,
  isAdmin,
  busyArtistId,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: ArtistAdminTableProps) => {
  const columns: DataTableColumn<Artist>[] = [
    {
      key: 'name',
      header: 'Artista',
      render: (artist) => (
        <span className="data-table__name-cell data-table__name-cell--stacked">
          {artist.name}
          {/* Adelanto de la biografía, cortado con puntos suspensivos. */}
          {artist.biography && <span className="data-table__hint">{artist.biography}</span>}
        </span>
      ),
    },
    {
      key: 'albums',
      header: 'Álbumes',
      render: (artist) => artist.albumsCount,
    },
    {
      key: 'state',
      header: 'Estado',
      render: (artist) => (
        <Badge tone={STATE_TONES[artist.state]}>{STATE_LABELS[artist.state]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (artist) => {
        const isBusy = busyArtistId === artist.id;
        const canEdit = artist.canBeEditedBy(currentUserId, isAdmin);

        return (
          <div className="data-table__actions">
            {canEdit && (
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => onEdit(artist)}>
                Editar
              </Button>
            )}

            {/* La moderación es exclusiva del ADMIN, y solo tiene sentido sobre
                un aporte que todavía nadie revisó. */}
            {isAdmin && artist.isPending && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onApprove(artist)}
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onReject(artist)}
                >
                  Rechazar
                </Button>
              </>
            )}

            {isAdmin && (
              <Button
                variant="danger"
                size="sm"
                disabled={isBusy}
                onClick={() => onDelete(artist)}
              >
                Eliminar
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    // align="top" porque la primera columna puede tener dos líneas (nombre y
    // biografía) y el resto se leería descolgado si quedara centrado.
    <DataTable columns={columns} rows={artists} getRowKey={(artist) => artist.id} align="top" />
  );
};
