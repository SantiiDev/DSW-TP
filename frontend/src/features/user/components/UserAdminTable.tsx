// Tabla de usuarios del panel de administración: muestra todas las cuentas
// (activas y dadas de baja) y permite cambiarles el rol o activarlas/desactivarlas.
//
// Las cuentas no se borran: la baja es lógica, así que la fila sigue apareciendo
// marcada como "Inactivo" y se puede reactivar cuando haga falta.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AdminUsersPage) con onChangeRole / onToggleActive.
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
  /** Pide activar (si está inactivo) o desactivar (si está activo) esa cuenta. */
  onToggleActive: (user: User) => void;
};

export const UserAdminTable = ({
  users,
  currentUserId,
  busyUserId,
  onChangeRole,
  onToggleActive,
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isBusy = busyUserId === user.id;

            return (
              // La fila de una cuenta dada de baja se pinta atenuada para que se
              // distinga de un vistazo entre las activas.
              <tr key={user.id} className={user.isActive ? '' : 'admin-users__row--inactive'}>
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
                  <span
                    className={`admin-users__status admin-users__status--${
                      user.isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {/* El admin no puede desactivarse a sí mismo desde el panel: se
                      quedaría sin sesión a mitad de la pantalla. Para dar de baja
                      la cuenta propia está /profile. */}
                  {isCurrentUser ? (
                    <span className="admin-users__no-action">—</span>
                  ) : (
                    <button
                      type="button"
                      className={`admin-users__toggle-btn admin-users__toggle-btn--${
                        user.isActive ? 'deactivate' : 'activate'
                      }`}
                      disabled={isBusy}
                      onClick={() => onToggleActive(user)}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
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
