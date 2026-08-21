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
  // Usuario que el admin eligió activar o desactivar, a la espera de que confirme
  // el diálogo. Se guarda el usuario entero (y no solo el id) porque el texto del
  // diálogo depende de su nombre y de si la cuenta está activa o no.
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

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

  // Confirma la baja o el alta de una cuenta. La baja es lógica: la fila no
  // desaparece de la tabla, se actualiza con el estado nuevo.
  const handleConfirmToggleActive = async () => {
    if (!userToToggle) return;

    const { id, isActive } = userToToggle;
    setUserToToggle(null);
    setBusyUserId(id);
    setError(null);

    try {
      const updated = await userService.setActive(id, !isActive);
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
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
            Dar de alta cuentas, cambiar roles y activar o desactivar usuarios de Musicboxd.
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
              onToggleActive={setUserToToggle}
            />
          )}
        </section>
      </main>
      <Footer />

      <ConfirmDialog
        isOpen={userToToggle !== null}
        title={userToToggle?.isActive ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          userToToggle?.isActive
            ? `¿Seguro que querés desactivar la cuenta de ${userToToggle.username}? No va a poder iniciar sesión, pero sus reseñas se conservan y podés reactivarla cuando quieras.`
            : `¿Querés volver a activar la cuenta de ${userToToggle?.username ?? ''}? Va a poder iniciar sesión de nuevo.`
        }
        confirmLabel={userToToggle?.isActive ? 'Desactivar' : 'Activar'}
        // Solo la baja se pinta como destructiva: reactivar no rompe nada.
        isDestructive={userToToggle?.isActive ?? false}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setUserToToggle(null)}
      />
    </>
  );
};
