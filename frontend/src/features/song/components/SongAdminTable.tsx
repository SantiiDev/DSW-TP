// Tabla de canciones del panel de administración: muestra el catálogo con su
// estado de moderación y los botones de editar, eliminar y aprobar/rechazar.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de álbumes, artistas, géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (SongAdminSection) con los handlers que recibe.
import { Badge } from '../../../core/components/Badge';
import { Button } from '../../../core/components/Button';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { STATE_LABELS, STATE_TONES } from '../models/Song';
import type { Song } from '../models/Song';

type SongAdminTableProps = {
  songs: Song[];
  /** Id del usuario logueado: decide qué aportes propios puede editar. */
  currentUserId: number;
  isAdmin: boolean;
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busySongId: number | null;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onApprove: (song: Song) => void;
  onReject: (song: Song) => void;
};

export const SongAdminTable = ({
  songs,
  currentUserId,
  isAdmin,
  busySongId,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: SongAdminTableProps) => {
  const columns: DataTableColumn<Song>[] = [
    {
      key: 'title',
      header: 'Canción',
      render: (song) => (
        <span className="data-table__name-cell data-table__name-cell--stacked">
          {song.title}
          {/* Álbum y artista en una sola línea: hay muchos títulos repetidos
              ("Intro") y sin esto no se sabría cuál es cuál. */}
          <span className="data-table__hint">{song.locationLabel}</span>
        </span>
      ),
    },
    {
      key: 'track',
      header: 'Pista',
      // Una canción suelta no forma parte de ninguna lista, así que su número no
      // significa nada: se muestra un guión.
      render: (song) => (song.album ? song.numberTrack : '—'),
    },
    {
      key: 'duration',
      header: 'Duración',
      render: (song) => song.durationLabel,
    },
    {
      key: 'state',
      header: 'Estado',
      render: (song) => <Badge tone={STATE_TONES[song.state]}>{STATE_LABELS[song.state]}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (song) => {
        const isBusy = busySongId === song.id;
        const canEdit = song.canBeEditedBy(currentUserId, isAdmin);

        return (
          <div className="data-table__actions">
            {canEdit && (
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => onEdit(song)}>
                Editar
              </Button>
            )}

            {/* La moderación es exclusiva del ADMIN, y solo tiene sentido sobre
                un aporte que todavía nadie revisó. */}
            {isAdmin && song.isPending && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onApprove(song)}
                >
                  Aprobar
                </Button>
                <Button variant="danger" size="sm" disabled={isBusy} onClick={() => onReject(song)}>
                  Rechazar
                </Button>
              </>
            )}

            {isAdmin && (
              <Button variant="danger" size="sm" disabled={isBusy} onClick={() => onDelete(song)}>
                Eliminar
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    // align="top" porque la primera columna tiene dos líneas (título y álbum) y
    // el resto se leería descolgado si quedara centrado.
    <DataTable columns={columns} rows={songs} getRowKey={(song) => song.id} align="top" />
  );
};
