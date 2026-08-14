// Panel de administración de usuarios (/admin/users).
// Concentra el estado de la pantalla (listado, carga, errores) y delega el dibujo
// en CreateUserForm y UserAdminTable.
//
// Ruta protegida con roles={['ADMIN']}, pero la validación real es la del backend:
// todos estos endpoints exigen rol ADMIN aunque alguien fuerce la URL.
import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { Loader } from '../../../core/components/Loader';
import { ConfirmDialog } from '../../../core/components/Modal';
import { useAuth } from '../../../core/context/AuthContext';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import { userService } from '../services/userService';
import type { CreateUserInput } from '../services/userService';
import { UserAdminTable } from '../components/UserAdminTable';
import { CreateUserForm } from '../components/CreateUserForm';
import type { User, UserRole } from '../models/User';
import '../styles/_admin-users.scss';

export const AdminUsersPage = () => {
  const { state: authState } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // Fila con una operación en curso: deshabilita solo sus controles, no toda la tabla.
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  // Usuario que el admin eligió eliminar, a la espera de que confirme el diálogo.
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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

  const handleChangeRole = async (user: User, rol: UserRole) => {
    setBusyUserId(user.id);
    setError(null);

    try {
      const updated = await userService.update(user.id, { rol });
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="admin-users">
        <header className="admin-users__header">
          <h1 className="admin-users__title">Administración de usuarios</h1>
          <p className="admin-users__subtitle">
            Dar de alta cuentas, cambiar roles y eliminar usuarios de Musicboxd.
          </p>
        </header>

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
            <UserAdminTable
              users={users}
              currentUserId={authState.user?.id ?? 0}
              busyUserId={busyUserId}
              onChangeRole={handleChangeRole}
              onDelete={setUserToDelete}
            />
          )}
        </section>
      </main>
      <Footer />

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
