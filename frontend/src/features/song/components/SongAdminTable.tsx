// Tabla de canciones del panel de administración: muestra el catálogo con su
// estado de moderación y los íconos de editar, eliminar y aprobar/rechazar.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de álbumes, artistas, géneros y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (SongAdminSection) con los handlers que recibe.
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '../../../core/components/Badge';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { IconButton } from '../../../core/components/IconButton';
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
              <IconButton
                icon={<Pencil size={16} aria-hidden="true" />}
                label="Editar"
                disabled={isBusy}
                onClick={() => onEdit(song)}
              />
            )}

            {/* La moderación es exclusiva del ADMIN, y solo tiene sentido sobre
                un aporte que todavía nadie revisó. */}
            {isAdmin && song.isPending && (
              <>
                <IconButton
                  icon={<Check size={16} aria-hidden="true" />}
                  label="Aprobar"
                  tone="success"
                  disabled={isBusy}
                  onClick={() => onApprove(song)}
                />
                <IconButton
                  icon={<X size={16} aria-hidden="true" />}
                  label="Rechazar"
                  tone="danger"
                  disabled={isBusy}
                  onClick={() => onReject(song)}
                />
              </>
            )}

            {isAdmin && (
              <IconButton
                icon={<Trash2 size={16} aria-hidden="true" />}
                label="Eliminar"
                tone="danger"
                disabled={isBusy}
                onClick={() => onDelete(song)}
              />
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
