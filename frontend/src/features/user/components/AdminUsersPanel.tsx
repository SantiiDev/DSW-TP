// Pestaña "Usuarios" del panel de administración.
//
// Concentra el estado de la gestión de cuentas (listado, alta, cambios de rol
// pendientes, baja y reactivación) y delega el dibujo en CreateUserForm,
// UserAdminTable y RoleChangesBar.
//
// La baja es LÓGICA: suspender una cuenta no la saca de la lista, le cambia el
// estado. Por eso las dos operaciones reemplazan la fila en vez de quitarla.
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
  // Usuario que el admin eligió suspender, a la espera de que confirme el diálogo.
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  // Cambios de rol en borrador: se aplican recién al apretar "Guardar cambios".
  const [pendingRoles, setPendingRoles] = useState<PendingRoles>({});
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const pendingCount = Object.keys(pendingRoles).length;
  // Las cuentas dadas de baja siguen en el listado, así que se cuentan aparte
  // para que el admin sepa cuántas hay sin recorrer la tabla entera.
  const suspendedCount = users.filter((user) => !user.isActive).length;

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

  /** Reemplaza una fila del listado por su versión actualizada. */
  const replaceUser = (updated: User) => {
    setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
  };

  /**
   * Confirma la baja de la cuenta elegida.
   *
   * Es una baja lógica: el backend devuelve el usuario ya suspendido y la fila se
   * reemplaza en el listado. Un cambio de rol pendiente sobre esa cuenta se
   * descarta, porque la cuenta quedó deshabilitada y ese cambio ya no tiene
   * sentido hasta que se la reactive.
   */
  const handleConfirmSuspend = async () => {
    if (!userToSuspend) return;

    const { id } = userToSuspend;
    setUserToSuspend(null);
    setBusyUserId(id);
    setError(null);

    try {
      replaceUser(await userService.suspend(id));
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

  /**
   * Vuelve a habilitar una cuenta suspendida.
   * No pide confirmación: no se pierde nada y se puede volver a suspender.
   */
  const handleActivate = async (user: User) => {
    setBusyUserId(user.id);
    setError(null);

    try {
      replaceUser(await userService.activate(user.id));
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
        <h2 className="admin-users__list-title">
          Usuarios registrados ({users.length})
          {suspendedCount > 0 && (
            <span className="admin-users__list-note">
              {suspendedCount === 1 ? '1 suspendido' : `${suspendedCount} suspendidos`}
            </span>
          )}
        </h2>

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
              onSuspend={setUserToSuspend}
              onActivate={handleActivate}
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
        isOpen={userToSuspend !== null}
        title="Suspender usuario"
        message={`¿Seguro que querés suspender la cuenta de ${userToSuspend?.username ?? ''}? No va a poder iniciar sesión, pero sus reseñas se mantienen y podés reactivarla cuando quieras.`}
        confirmLabel="Suspender"
        isDestructive
        onConfirm={handleConfirmSuspend}
        onCancel={() => setUserToSuspend(null)}
      />
    </>
  );
};
