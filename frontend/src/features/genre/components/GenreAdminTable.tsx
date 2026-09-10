// Tabla de géneros del panel de administración: muestra el catálogo con cuántos
// álbumes tiene cada uno y los íconos de editar y eliminar.
//
// Solo define sus columnas: el armado de la tabla (wrapper con scroll, cabecera,
// filas) lo pone DataTable, el mismo que usan las tablas de artistas y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (GenreAdminSection) con los handlers que recibe.
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../core/components/DataTable';
import { IconButton } from '../../../core/components/IconButton';
import type { DataTableColumn } from '../../../core/components/DataTable';
import type { Genre } from '../models/Genre';

type GenreAdminTableProps = {
  genres: Genre[];
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busyGenreId: number | null;
  onEdit: (genre: Genre) => void;
  onDelete: (genre: Genre) => void;
};

export const GenreAdminTable = ({
  genres,
  busyGenreId,
  onEdit,
  onDelete,
}: GenreAdminTableProps) => {
  const columns: DataTableColumn<Genre>[] = [
    {
      key: 'name',
      header: 'Género',
      render: (genre) => <span className="data-table__name-cell">{genre.name}</span>,
    },
    {
      key: 'albums',
      header: 'Álbumes',
      render: (genre) => genre.albumsCount,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (genre) => {
        const isBusy = busyGenreId === genre.id;

        return (
          <div className="data-table__actions">
            <IconButton
              icon={<Pencil size={16} aria-hidden="true" />}
              label="Editar"
              disabled={isBusy}
              onClick={() => onEdit(genre)}
            />

            {/* El botón se muestra siempre, también cuando el género tiene
                álbumes: en ese caso el diálogo explica por qué no se puede
                borrar, que es más útil que un botón ausente sin motivo. */}
            <IconButton
              icon={<Trash2 size={16} aria-hidden="true" />}
              label="Eliminar"
              tone="danger"
              disabled={isBusy}
              onClick={() => onDelete(genre)}
            />
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} rows={genres} getRowKey={(genre) => genre.id} />;
};
