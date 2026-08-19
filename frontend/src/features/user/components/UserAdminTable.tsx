// Tabla de usuarios del panel de administración: muestra todas las cuentas y
// permite elegirles otro rol o eliminarlas.
//
// El rol elegido en el select NO se guarda solo: queda como cambio pendiente
// (ver `pendingRoles`) hasta que el admin confirma desde RoleChangesBar. La fila
// se marca mientras tanto para que se vea qué está por cambiar.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AdminUsersPanel) con onSelectRole / onDelete.
import { Avatar } from '../../../core/components/Avatar';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { User, UserRole } from '../models/User';

type UserAdminTableProps = {
  users: User[];
  /** Id del admin logueado: su propia fila no se puede eliminar desde acá. */
  currentUserId: number;
  /** Id de la fila que tiene una operación en curso, para deshabilitar sus controles. */
  busyUserId: number | null;
  /** Roles elegidos pero todavía sin guardar, indexados por id de usuario. */
  pendingRoles: Record<number, UserRole>;
  /** true mientras se guarda el lote de cambios: bloquea todos los selects. */
  isSaving: boolean;
  onSelectRole: (user: User, rol: UserRole) => void;
  onDelete: (user: User) => void;
};

export const UserAdminTable = ({
  users,
  currentUserId,
  busyUserId,
  pendingRoles,
  isSaving,
  onSelectRole,
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

            // El select muestra el rol pendiente si lo hay, y si no el guardado:
            // así el admin ve lo que eligió aunque todavía no lo haya confirmado.
            const pendingRole = pendingRoles[user.id];
            const hasPendingChange = pendingRole !== undefined;
            const selectedRole = pendingRole ?? user.rol;

            return (
              <tr
                key={user.id}
                className={hasPendingChange ? 'admin-users__row--pending' : undefined}
              >
                <td>
                  <span className="admin-users__user-cell">
                    <Avatar url={user.urlAvatar} username={user.username} size="md" />
                    {user.username}
                    {isCurrentUser && <span className="admin-users__you-tag">vos</span>}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className="admin-users__role-cell">
                    <select
                      className={`admin-users__role-select ${
                        hasPendingChange ? 'admin-users__role-select--pending' : ''
                      }`}
                      value={selectedRole}
                      disabled={isBusy || isSaving}
                      aria-label={`Rol de ${user.username}`}
                      onChange={(e) => onSelectRole(user, e.target.value as UserRole)}
                    >
                      {USER_ROLES.map((rol) => (
                        <option key={rol} value={rol}>
                          {ROLE_LABELS[rol]}
                        </option>
                      ))}
                    </select>

                    {/* Deja explícito de qué rol viene, para que se entienda qué
                        se va a aplicar al guardar. */}
                    {hasPendingChange && (
                      <span className="admin-users__pending-tag">
                        antes: {ROLE_LABELS[user.rol]}
                      </span>
                    )}
                  </span>
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
                      disabled={isBusy || isSaving}
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
