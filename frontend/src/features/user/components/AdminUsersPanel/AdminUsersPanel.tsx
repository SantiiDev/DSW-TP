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
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { Button } from '../../../../core/components/Button';
import { FormModal } from '../../../../core/components/FormModal';
import { Loader } from '../../../../core/components/Loader';
import { SearchBar } from '../../../../core/components/SearchBar';
import { ShowMore } from '../../../../core/components/ShowMore';
import { ConfirmDialog } from '../../../../core/components/Modal';
import { useAuth } from '../../../../core/context/AuthContext';
import { useFetch } from '../../../../core/hooks/useFetch';
import { useShowMore } from '../../../../core/hooks/useShowMore';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { userService } from '../../services/userService';
import type { CreateUserInput } from '../../services/userService';
import { UserAdminTable } from '../UserAdminTable';
import { CreateUserForm } from '../CreateUserForm';
import { RoleChangesBar } from '../RoleChangesBar';
import type { User } from '../../models/User';
import { usePendingRoles } from './usePendingRoles';
import '../../pages/AdminPage/AdminPage.scss';

// Cuántas filas se muestran de entrada y cuántas suma cada "Ver más". Mismo
// criterio que ArtistAdminSection: sin esto, una base con muchos usuarios hace
// una tabla larguísima de una sola vez.
const PAGE_SIZE = 15;

export const AdminUsersPanel = () => {
  const { state: authState } = useAuth();

  const { data, isLoading, error, setData, setError } = useFetch(() => userService.list());
  const users = data ?? [];

  // Texto del buscador. La lista ya llegó entera (userService.list no filtra), así que
  // se filtra acá, al instante y sin pedir nada: no hace falta la pausa de
  // useAppliedSearch, que existe para no disparar una request por tecla.
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filteredUsers = query
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
    : users;

  const [isCreating, setIsCreating] = useState(false);
  // El alta vive en un modal: a la pestaña se entra a mirar y a cambiar roles
  // mucho más seguido que a crear cuentas a mano.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Error del alta. Va aparte del error del panel porque se muestra DENTRO del
  // modal, donde el admin está mirando cuando falla.
  const [formError, setFormError] = useState<string | null>(null);
  // Fila con una operación en curso: deshabilita solo sus controles, no toda la tabla.
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  // Usuario que el admin eligió suspender, a la espera de que confirme el diálogo.
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  // Cambios de rol en borrador: se aplican recién al apretar "Guardar cambios".
  const { pendingRoles, pendingCount, isSavingRoles, selectRole, discardRoles, dropPendingRole, saveRoles } =
    usePendingRoles(setData, setError);
  // Cuántas filas se muestran (paginado del lado del cliente). Al cambiar la
  // búsqueda vuelve a la primera página: el "Ver más" de un resultado no tiene
  // sentido sobre otro.
  const { visibleItems: visibleUsers, hasMore: hasMoreUsers, showMore } = useShowMore(filteredUsers, PAGE_SIZE, query);

  // Las cuentas dadas de baja siguen en el listado, así que se cuentan aparte
  // para que el admin sepa cuántas hay sin recorrer la tabla entera.
  const suspendedCount = users.filter((user) => !user.isActive).length;

  /** Abre el modal de alta, sin arrastrar el error de un intento anterior. */
  const handleOpenCreate = () => {
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCreate = async (input: CreateUserInput): Promise<boolean> => {
    setIsCreating(true);
    setError(null);
    setFormError(null);

    try {
      const created = await userService.create(input);
      // Se agrega al final en vez de recargar toda la lista: es una request menos
      // y el orden coincide con el del backend, que devuelve por id ascendente.
      setData((current) => [...(current ?? []), created]);
      setIsFormOpen(false);
      return true;
    } catch (err) {
      // El modal queda abierto con lo que se había escrito: cerrarlo obligaría a
      // tipear todo de nuevo por un mail ya registrado.
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  /** Reemplaza una fila del listado por su versión actualizada. */
  const replaceUser = (updated: User) => {
    setData((current) => (current ?? []).map((u) => (u.id === updated.id ? updated : u)));
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
      dropPendingRole(id);
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
      {error && <Alert tone="error">{error}</Alert>}

      <section className="admin-users__list">
        <div className="admin-users__list-head">
          <h2 className="admin-users__list-title">
            Usuarios registrados ({users.length})
            {suspendedCount > 0 && (
              <span className="admin-users__list-note">
                {suspendedCount === 1 ? '1 suspendido' : `${suspendedCount} suspendidos`}
              </span>
            )}
          </h2>

          <Button onClick={handleOpenCreate}>
            <Plus size={16} aria-hidden="true" />
            Agregar usuario
          </Button>
        </div>

        <SearchBar
          value={search}
          placeholder="Buscar un usuario por nombre o email..."
          onChange={setSearch}
          onClear={() => setSearch('')}
        />

        {isLoading ? (
          <Loader message="Cargando usuarios..." />
        ) : users.length === 0 ? (
          <p className="admin-users__empty">Todavía no hay usuarios registrados.</p>
        ) : filteredUsers.length === 0 ? (
          <p className="admin-users__empty">No hay usuarios que coincidan con "{search.trim()}".</p>
        ) : (
          <>
            <UserAdminTable
              users={visibleUsers}
              currentUserId={authState.user?.id ?? 0}
              busyUserId={busyUserId}
              pendingRoles={pendingRoles}
              isSaving={isSavingRoles}
              onSelectRole={selectRole}
              onSuspend={setUserToSuspend}
              onActivate={handleActivate}
            />

            {hasMoreUsers && (
              <ShowMore
                shown={visibleUsers.length}
                total={filteredUsers.length}
                noun="usuarios"
                onShowMore={showMore}
              />
            )}

            <RoleChangesBar
              count={pendingCount}
              isSaving={isSavingRoles}
              onSave={saveRoles}
              onDiscard={discardRoles}
            />
          </>
        )}
      </section>

      {/* El alta no tiene edición: una cuenta ya creada se administra desde la
          tabla (rol y suspensión), así que el modal es siempre el mismo. */}
      <FormModal
        isOpen={isFormOpen}
        title="Crear usuario"
        hint="A diferencia del registro público, acá se elige el rol de la cuenta."
        error={formError}
        isBusy={isCreating}
        onClose={() => setIsFormOpen(false)}
      >
        <CreateUserForm
          isSubmitting={isCreating}
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      </FormModal>

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
