// Tabla de usuarios del panel de administración: muestra todas las cuentas y
// permite elegirles otro rol, suspenderlas o reactivarlas.
//
// Solo define sus columnas: el armado de la tabla lo pone DataTable, el mismo
// que usan las tablas de artistas y géneros.
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
import { UserCheck, UserX } from 'lucide-react';
import { Avatar } from '../../../core/components/Avatar';
import { Badge } from '../../../core/components/Badge';
import { DataTable } from '../../../core/components/DataTable';
import type { DataTableColumn } from '../../../core/components/DataTable';
import { IconButton } from '../../../core/components/IconButton';
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
  const columns: DataTableColumn<User>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (user) => (
        <span className="data-table__name-cell">
          <Avatar url={user.urlAvatar} username={user.username} size="md" />
          {user.username}
          {user.id === currentUserId && <Badge tone="success">vos</Badge>}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (user) => {
        // El desplegable muestra el rol pendiente si lo hay, y si no el
        // guardado: así el admin ve lo que eligió aunque todavía no lo haya
        // confirmado.
        const pendingRole = pendingRoles[user.id];
        const hasPendingChange = pendingRole !== undefined;
        const isBusy = busyUserId === user.id;

        return (
          <span className="admin-users__role-cell">
            <Select
              options={ROLE_OPTIONS}
              value={pendingRole ?? user.rol}
              disabled={isBusy || isSaving}
              size="sm"
              ariaLabel={`Rol de ${user.username}`}
              highlighted={hasPendingChange}
              onChange={(rol) => onSelectRole(user, rol)}
            />

            {/* Deja explícito de qué rol viene, para que se entienda qué se va a
                aplicar al guardar. */}
            {hasPendingChange && (
              <span className="admin-users__pending-tag">antes: {ROLE_LABELS[user.rol]}</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'state',
      header: 'Estado',
      render: (user) => (
        <Badge tone={user.isActive ? 'success' : 'danger'}>{user.stateLabel}</Badge>
      ),
    },
    {
      key: 'since',
      header: 'Miembro desde',
      render: (user) => user.registrationDate.toLocaleDateString('es-AR'),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user) => {
        const isBusy = busyUserId === user.id;

        // El admin no puede darse de baja a sí mismo desde el panel: se quedaría
        // sin sesión a mitad de la pantalla. Para dar de baja la cuenta propia
        // está /profile.
        if (user.id === currentUserId) {
          return <span className="data-table__no-action">—</span>;
        }

        return user.isActive ? (
          <IconButton
            icon={<UserX size={16} aria-hidden="true" />}
            label="Suspender"
            tone="danger"
            disabled={isBusy || isSaving}
            onClick={() => onSuspend(user)}
          />
        ) : (
          <IconButton
            icon={<UserCheck size={16} aria-hidden="true" />}
            label="Reactivar"
            tone="success"
            disabled={isBusy || isSaving}
            onClick={() => onActivate(user)}
          />
        );
      },
    },
  ];

  /** Marca la fila con un cambio de rol sin guardar y/o con la cuenta suspendida. */
  const getRowClassName = (user: User): string | undefined => {
    const classes = [
      pendingRoles[user.id] !== undefined ? 'admin-users__row--pending' : '',
      user.isActive ? '' : 'admin-users__row--suspended',
    ].filter(Boolean);

    return classes.length > 0 ? classes.join(' ') : undefined;
  };

  return (
    <DataTable
      columns={columns}
      rows={users}
      getRowKey={(user) => user.id}
      getRowClassName={getRowClassName}
    />
  );
};
