// Tabla de artistas del panel de administración: muestra el catálogo con su
// estado de moderación y los botones de editar, eliminar y aprobar/rechazar.
//
// Es presentacional, igual que UserAdminTable: no llama a la API ni guarda estado
// propio; avisa al padre (ArtistAdminSection) con los handlers que recibe.
import { STATE_LABELS } from '../models/Artist';
import type { Artist } from '../models/Artist';
import '../styles/_artist.scss';

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
  return (
    // El wrapper le da scroll horizontal propio a la tabla: cuatro columnas no
    // entran en 375px y sin esto rompería el layout de la página.
    <div className="artist-admin__table-wrapper">
      <table className="artist-admin__table">
        <thead>
          <tr>
            <th>Artista</th>
            <th>Álbumes</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {artists.map((artist) => {
            const isBusy = busyArtistId === artist.id;
            const canEdit = artist.canBeEditedBy(currentUserId, isAdmin);

            return (
              <tr key={artist.id}>
                <td>
                  <span className="artist-admin__name-cell">
                    {artist.name}
                    {artist.biography && (
                      <span className="artist-admin__bio">{artist.biography}</span>
                    )}
                  </span>
                </td>
                <td>{artist.albumsCount}</td>
                <td>
                  <span className={`artist-admin__badge artist-admin__badge--${artist.state}`}>
                    {STATE_LABELS[artist.state]}
                  </span>
                </td>
                <td>
                  <div className="artist-admin__actions">
                    {canEdit && (
                      <button
                        type="button"
                        className="artist-admin__btn"
                        disabled={isBusy}
                        onClick={() => onEdit(artist)}
                      >
                        Editar
                      </button>
                    )}

                    {/* La moderación es exclusiva del ADMIN, y solo tiene sentido
                        sobre un aporte que todavía nadie revisó. */}
                    {isAdmin && artist.isPending && (
                      <>
                        <button
                          type="button"
                          className="artist-admin__btn artist-admin__btn--approve"
                          disabled={isBusy}
                          onClick={() => onApprove(artist)}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="artist-admin__btn artist-admin__btn--reject"
                          disabled={isBusy}
                          onClick={() => onReject(artist)}
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        className="artist-admin__btn artist-admin__btn--delete"
                        disabled={isBusy}
                        onClick={() => onDelete(artist)}
                      >
                        Eliminar
                      </button>
                    )}
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
