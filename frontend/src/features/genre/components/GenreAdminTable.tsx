// Tabla de géneros del panel de administración: muestra el catálogo con cuántos
// álbumes tiene cada uno y los botones de editar y eliminar.
//
// Es presentacional, igual que ArtistAdminTable: no llama a la API ni guarda
// estado propio; avisa al padre (GenreAdminSection) con los handlers que recibe.
import type { Genre } from '../models/Genre';
import '../styles/_genre.scss';

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
  return (
    // El wrapper le da scroll horizontal propio a la tabla: tres columnas con
    // botones no entran en 375px y sin esto rompería el layout de la página.
    <div className="genre-admin__table-wrapper">
      <table className="genre-admin__table">
        <thead>
          <tr>
            <th>Género</th>
            <th>Álbumes</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {genres.map((genre) => {
            const isBusy = busyGenreId === genre.id;

            return (
              <tr key={genre.id}>
                <td>
                  <span className="genre-admin__name-cell">{genre.name}</span>
                </td>
                <td>{genre.albumsCount}</td>
                <td>
                  <div className="genre-admin__actions">
                    <button
                      type="button"
                      className="genre-admin__btn"
                      disabled={isBusy}
                      onClick={() => onEdit(genre)}
                    >
                      Editar
                    </button>

                    {/* El botón se muestra siempre, también cuando el género tiene
                        álbumes: en ese caso el diálogo explica por qué no se puede
                        borrar, que es más útil que un botón ausente sin motivo. */}
                    <button
                      type="button"
                      className="genre-admin__btn genre-admin__btn--delete"
                      disabled={isBusy}
                      onClick={() => onDelete(genre)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
