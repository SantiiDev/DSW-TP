// Tabla de datos reutilizable.
//
// UserAdminTable, ArtistAdminTable y GenreAdminTable eran tres componentes con
// la misma estructura: un wrapper con scroll horizontal, un <thead> con los
// títulos y un <tbody> que recorre las filas. Lo único distinto entre ellas eran
// las columnas y qué se dibuja en cada celda; eso es justamente lo que ahora se
// pasa por props.
//
//   <DataTable
//     columns={[
//       { key: 'name', header: 'Género', render: (g) => g.name },
//       { key: 'actions', header: 'Acciones', render: (g) => <Button .../> },
//     ]}
//     rows={genres}
//     getRowKey={(g) => g.id}
//   />
import type { ReactNode } from 'react';
import './_data-table.scss';

/**
 * Una columna de la tabla.
 * @template T tipo de cada fila (Genre, Artist, User...).
 */
export type DataTableColumn<T> = {
  /** Identificador de la columna; se usa como key de React en el <thead>. */
  key: string;
  header: string;
  /** Qué dibujar en la celda de esa fila. */
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Key estable de cada fila (normalmente su id). */
  getRowKey: (row: T) => string | number;
  /** Clase extra por fila, para marcarlas (pendiente, suspendida, etc.). */
  getRowClassName?: (row: T) => string | undefined;
  /**
   * Alineación vertical de las celdas. 'top' cuando alguna columna tiene dos
   * líneas (nombre + descripción); 'middle' cuando son todas de una línea.
   */
  align?: 'top' | 'middle';
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  getRowClassName,
  align = 'middle',
}: DataTableProps<T>) {
  return (
    // El wrapper le da scroll horizontal propio a la tabla: cuatro o cinco
    // columnas no entran en 375px y sin esto rompería el layout de la página.
    <div className="data-table__wrapper">
      <table className={`data-table data-table--${align}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className={getRowClassName?.(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
