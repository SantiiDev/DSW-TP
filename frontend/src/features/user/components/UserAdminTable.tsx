// Tabla de usuarios del panel de administración: muestra todas las cuentas y
// permite cambiarles el rol o eliminarlas.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AdminUsersPage) con onChangeRole / onDelete.
import { Avatar } from '../../../core/components/Avatar';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { User, UserRole } from '../models/User';

type UserAdminTableProps = {
  users: User[];
  /** Id del admin logueado: su propia fila no se puede eliminar desde acá. */
  currentUserId: number;
  /** Id de la fila que tiene una operación en curso, para deshabilitar sus controles. */
  busyUserId: number | null;
  onChangeRole: (user: User, rol: UserRole) => void;
  onDelete: (user: User) => void;
};

export const UserAdminTable = ({
  users,
  currentUserId,
  busyUserId,
  onChangeRole,
  onDelete,
}: UserAdminTableProps) => {
  return (
    // El wrapper permite scroll horizontal en mobile: una tabla de 5 columnas no
    // entra en 375px y sin esto rompería el layout de la página.
    <div className="admin-users__table-wrapper">
      <table className="admin-users__table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Miembro desde</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isBusy = busyUserId === user.id;

            return (
              <tr key={user.id}>
                <td>
                  <span className="admin-users__user-cell">
                    <Avatar url={user.urlAvatar} username={user.username} size="md" />
                    {user.username}
                    {isCurrentUser && <span className="admin-users__you-tag">vos</span>}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="admin-users__role-select"
                    value={user.rol}
                    disabled={isBusy}
                    aria-label={`Rol de ${user.username}`}
                    onChange={(e) => onChangeRole(user, e.target.value as UserRole)}
                  >
                    {USER_ROLES.map((rol) => (
                      <option key={rol} value={rol}>
                        {ROLE_LABELS[rol]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{user.registrationDate.toLocaleDateString('es-AR')}</td>
                <td>
                  {/* El admin no puede borrarse a sí mismo desde el panel: se
                      quedaría sin sesión a mitad de la pantalla. Para dar de baja
                      la cuenta propia está /profile. */}
                  {isCurrentUser ? (
                    <span className="admin-users__no-action">—</span>
                  ) : (
                    <button
                      type="button"
                      className="admin-users__delete-btn"
                      disabled={isBusy}
                      onClick={() => onDelete(user)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
