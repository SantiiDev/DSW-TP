// Pestaña "Usuarios" del panel de administración.
//
// Concentra el estado de la gestión de cuentas (listado, alta, cambios de rol
// pendientes, baja) y delega el dibujo en CreateUserForm, UserAdminTable y
// RoleChangesBar.
//
// Todos estos endpoints exigen rol ADMIN en el backend: que la pestaña se vea
// solo dentro de /admin es comodidad de navegación, no la protección real.
import { useCallback, useEffect, useState } from 'react';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { userService } from '../services/userService';
import type { CreateUserInput } from '../services/userService';
import { UserAdminTable } from './UserAdminTable';
import { CreateUserForm } from './CreateUserForm';
import { RoleChangesBar } from './RoleChangesBar';
import type { User, UserRole } from '../models/User';

/** Roles elegidos y todavía sin guardar, indexados por id de usuario. */
type PendingRoles = Record<number, UserRole>;

export const AdminUsersPanel = () => {
  const { state: authState } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // Fila con una operación en curso: deshabilita solo sus controles, no toda la tabla.
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  // Usuario que el admin eligió eliminar, a la espera de que confirme el diálogo.
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  // Cambios de rol en borrador: se aplican recién al apretar "Guardar cambios".
  const [pendingRoles, setPendingRoles] = useState<PendingRoles>({});
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const pendingCount = Object.keys(pendingRoles).length;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setUsers(await userService.list());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (input: CreateUserInput): Promise<boolean> => {
    setIsCreating(true);
    setError(null);

    try {
      const created = await userService.create(input);
      // Se agrega al final en vez de recargar toda la lista: es una request menos
      // y el orden coincide con el del backend, que devuelve por id ascendente.
      setUsers((current) => [...current, created]);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Anota el rol elegido para un usuario, sin mandarlo todavía a la API.
   * Si vuelve a elegir el rol que ya tenía guardado, deja de contar como cambio.
   */
  const handleSelectRole = (user: User, rol: UserRole) => {
    setPendingRoles((current) => {
      const next = { ...current };

      if (rol === user.rol) {
        delete next[user.id];
      } else {
        next[user.id] = rol;
      }

      return next;
    });
  };

  const handleDiscardRoles = () => {
    setPendingRoles({});
    setError(null);
  };

  /**
   * Aplica todos los cambios de rol pendientes.
   *
   * Van de a uno porque la API expone un PATCH por usuario. Si alguno falla, los
   * que sí se guardaron quedan aplicados y solo el fallido sigue pendiente: así
   * el admin ve exactamente qué quedó sin hacer en vez de perder todo el lote.
   */
  const handleSaveRoles = async () => {
    const changes = Object.entries(pendingRoles);
    if (changes.length === 0) return;

    setIsSavingRoles(true);
    setError(null);

    const saved: User[] = [];
    const stillPending: PendingRoles = {};
    let firstError: string | null = null;

    for (const [id, rol] of changes) {
      const userId = Number(id);

      try {
        saved.push(await userService.update(userId, { rol }));
      } catch (err) {
        stillPending[userId] = rol;
        if (!firstError) firstError = getErrorMessage(err);
      }
    }

    setUsers((current) => current.map((u) => saved.find((s) => s.id === u.id) ?? u));
    setPendingRoles(stillPending);
    if (firstError) setError(firstError);
    setIsSavingRoles(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const { id } = userToDelete;
    setUserToDelete(null);
    setBusyUserId(id);
    setError(null);

    try {
      await userService.remove(id);
      setUsers((current) => current.filter((u) => u.id !== id));
      // Si tenía un cambio de rol en borrador ya no aplica: la cuenta no existe.
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <>
      {error && (
        <p className="admin-users__error" role="alert">
          {error}
        </p>
      )}

      <CreateUserForm isSubmitting={isCreating} onSubmit={handleCreate} />

      <section className="admin-users__list">
        <h2 className="admin-users__list-title">Usuarios registrados ({users.length})</h2>

        {isLoading ? (
          <Loader message="Cargando usuarios..." />
        ) : users.length === 0 ? (
          <p className="admin-users__empty">Todavía no hay usuarios registrados.</p>
        ) : (
          <>
            <UserAdminTable
              users={users}
              currentUserId={authState.user?.id ?? 0}
              busyUserId={busyUserId}
              pendingRoles={pendingRoles}
              isSaving={isSavingRoles}
              onSelectRole={handleSelectRole}
              onDelete={setUserToDelete}
            />

            <RoleChangesBar
              count={pendingCount}
              isSaving={isSavingRoles}
              onSave={handleSaveRoles}
              onDiscard={handleDiscardRoles}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        isOpen={userToDelete !== null}
        title="Eliminar usuario"
        message={`¿Seguro que querés eliminar la cuenta de ${userToDelete?.username ?? ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </>
  );
};
