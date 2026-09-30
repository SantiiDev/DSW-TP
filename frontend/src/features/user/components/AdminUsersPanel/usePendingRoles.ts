// Borrador de cambios de rol del panel de usuarios: el admin elige roles en la
// tabla y se aplican todos juntos recién al apretar "Guardar cambios".
//
// Vive en la carpeta de AdminUsersPanel porque es solo suyo: separa esta regla
// (qué cuenta como cambio, cómo se guarda el lote) del resto de la pestaña.
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { userService } from '../../services/userService';
import type { User, UserRole } from '../../models/User';

/** Roles elegidos y todavía sin guardar, indexados por id de usuario. */
export type PendingRoles = Record<number, UserRole>;

/**
 * @param setUsers reemplaza el listado en memoria (el setData de useFetch).
 * @param setError muestra un error en el panel (el setError de useFetch).
 */
export function usePendingRoles(
  setUsers: Dispatch<SetStateAction<User[] | null>>,
  setError: (message: string | null) => void
) {
  const [pendingRoles, setPendingRoles] = useState<PendingRoles>({});
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  /**
   * Anota el rol elegido para un usuario, sin mandarlo todavía a la API.
   * Si vuelve a elegir el rol que ya tenía guardado, deja de contar como cambio.
   */
  const selectRole = (user: User, rol: UserRole) => {
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

  const discardRoles = () => {
    setPendingRoles({});
    setError(null);
  };

  /** Saca del borrador el cambio de una cuenta (por ejemplo, porque se la suspendió). */
  const dropPendingRole = (userId: number) => {
    setPendingRoles((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
  };

  /**
   * Aplica todos los cambios de rol pendientes.
   *
   * Van de a uno porque la API expone un PATCH por usuario. Si alguno falla, los
   * que sí se guardaron quedan aplicados y solo el fallido sigue pendiente: así
   * el admin ve exactamente qué quedó sin hacer en vez de perder todo el lote.
   */
  const saveRoles = async () => {
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

    setUsers((current) => (current ?? []).map((u) => saved.find((s) => s.id === u.id) ?? u));
    setPendingRoles(stillPending);
    if (firstError) setError(firstError);
    setIsSavingRoles(false);
  };

  return {
    pendingRoles,
    pendingCount: Object.keys(pendingRoles).length,
    isSavingRoles,
    selectRole,
    discardRoles,
    dropPendingRole,
    saveRoles,
  };
}
