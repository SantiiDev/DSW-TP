// Tabla de artistas del panel de administración: muestra el catálogo con su
// estado de moderación y los íconos de editar, eliminar y aprobar/rechazar.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (ArtistAdminSection) con los handlers que recibe.
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { DataTable } from '../../../core/components/DataTable';
import { IconButton } from '../../../core/components/IconButton';
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
              <IconButton
                icon={<Pencil size={16} aria-hidden="true" />}
                label="Editar"
                disabled={isBusy}
                onClick={() => onEdit(artist)}
              />
            )}

            {/* La moderación es exclusiva del ADMIN, y solo tiene sentido sobre
                un aporte que todavía nadie revisó. */}
            {isAdmin && artist.isPending && (
              <>
                <IconButton
                  icon={<Check size={16} aria-hidden="true" />}
                  label="Aprobar"
                  tone="success"
                  disabled={isBusy}
                  onClick={() => onApprove(artist)}
                />
                <IconButton
                  icon={<X size={16} aria-hidden="true" />}
                  label="Rechazar"
                  tone="danger"
                  disabled={isBusy}
                  onClick={() => onReject(artist)}
                />
              </>
            )}

            {isAdmin && (
              <IconButton
                icon={<Trash2 size={16} aria-hidden="true" />}
                label="Eliminar"
                tone="danger"
                disabled={isBusy}
                onClick={() => onDelete(artist)}
              />
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
