// Servicio del CRUD de usuarios: centraliza las llamadas HTTP de /api/users y
// mapea la respuesta cruda del backend al modelo User.
import { httpClient } from '../../../core/services/httpClient';
import { toUser } from './authService';
import { User } from '../models/User';
import type { UserApiResponse } from '../models/User';

/** Campos editables de un usuario. Nunca incluye rol ni password. */
export type UpdateUserInput = {
  username?: string;
  email?: string;
};

export const userService = {
  /** Trae el perfil público de un usuario puntual. */
  async getById(id: number): Promise<User> {
    const data = await httpClient.get<UserApiResponse>(`/users/${id}`);
    return toUser(data);
  },

  /** Actualiza username y/o email de un usuario. */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    const data = await httpClient.patch<UserApiResponse>(`/users/${id}`, input);
    return toUser(data);
  },

  /** Elimina la cuenta de un usuario. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/users/${id}`);
  },
};
