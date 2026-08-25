// Tabla de usuarios del panel de administración: muestra todas las cuentas y
// permite elegirles otro rol, suspenderlas o reactivarlas.
//
// La baja es lógica: una cuenta suspendida sigue en la tabla, con su estado a la
// vista y el botón para volver a activarla. Nunca desaparece del listado.
//
// El rol elegido en el desplegable NO se guarda solo: queda como cambio
// pendiente (ver `pendingRoles`) hasta que el admin confirma desde
// RoleChangesBar. La fila se marca mientras tanto para que se vea qué está por
// cambiar.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AdminUsersPanel) con onSelectRole / onSuspend / onActivate.
import { Avatar } from '../../../core/components/Avatar';
import { Select } from '../../../core/components/Select';
import { ROLE_LABELS, USER_ROLES } from '../models/User';
import type { User, UserRole } from '../models/User';

type UserAdminTableProps = {
  users: User[];
  /** Id del admin logueado: su propia fila no se puede dar de baja desde acá. */
  currentUserId: number;
  /** Id de la fila que tiene una operación en curso, para deshabilitar sus controles. */
  busyUserId: number | null;
  /** Roles elegidos pero todavía sin guardar, indexados por id de usuario. */
  pendingRoles: Record<number, UserRole>;
  /** true mientras se guarda el lote de cambios: bloquea todos los desplegables. */
  isSaving: boolean;
  onSelectRole: (user: User, rol: UserRole) => void;
  /** Baja lógica: pide confirmación en el padre antes de suspender. */
  onSuspend: (user: User) => void;
  /** Vuelve a habilitar una cuenta suspendida. */
  onActivate: (user: User) => void;
};

// Las opciones del desplegable de rol son siempre las mismas: se arman una sola
// vez y no en cada fila.
const ROLE_OPTIONS = USER_ROLES.map((rol) => ({ value: rol, label: ROLE_LABELS[rol] }));

export const UserAdminTable = ({
  users,
  currentUserId,
  busyUserId,
  pendingRoles,
  isSaving,
  onSelectRole,
  onSuspend,
  onActivate,
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
            <th>Estado</th>
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

            // Una fila suspendida se atenúa para que se distinga de un vistazo,
            // sin sacarla del listado: la cuenta sigue existiendo.
            const rowClasses = [
              hasPendingChange ? 'admin-users__row--pending' : '',
              user.isActive ? '' : 'admin-users__row--suspended',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <tr key={user.id} className={rowClasses || undefined}>
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
                    <Select
                      options={ROLE_OPTIONS}
                      value={selectedRole}
                      disabled={isBusy || isSaving}
                      size="sm"
                      ariaLabel={`Rol de ${user.username}`}
                      className={hasPendingChange ? 'admin-users__role-select--pending' : ''}
                      onChange={(rol) => onSelectRole(user, rol)}
                    />

                    {/* Deja explícito de qué rol viene, para que se entienda qué
                        se va a aplicar al guardar. */}
                    {hasPendingChange && (
                      <span className="admin-users__pending-tag">
                        antes: {ROLE_LABELS[user.rol]}
                      </span>
                    )}
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-users__state ${
                      user.isActive
                        ? 'admin-users__state--active'
                        : 'admin-users__state--suspended'
                    }`}
                  >
                    {user.stateLabel}
                  </span>
                </td>
                <td>{user.registrationDate.toLocaleDateString('es-AR')}</td>
                <td>
                  {/* El admin no puede darse de baja a sí mismo desde el panel:
                      se quedaría sin sesión a mitad de la pantalla. Para dar de
                      baja la cuenta propia está /profile. */}
                  {isCurrentUser ? (
                    <span className="admin-users__no-action">—</span>
                  ) : user.isActive ? (
                    <button
                      type="button"
                      className="admin-users__suspend-btn"
                      disabled={isBusy || isSaving}
                      onClick={() => onSuspend(user)}
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-users__activate-btn"
                      disabled={isBusy || isSaving}
                      onClick={() => onActivate(user)}
                    >
                      Reactivar
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
