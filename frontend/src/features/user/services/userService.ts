// Servicio del CRUD de usuarios: centraliza las llamadas HTTP de /api/users y
// mapea la respuesta cruda del backend al modelo User.
import { httpClient } from '../../../core/services/httpClient';
import { toUser } from './authService';
import { User } from '../models/User';
import type { UserApiResponse, UserRole } from '../models/User';

/**
 * Campos editables de un usuario.
 * `rol` solo lo acepta el backend si quien hace la request es ADMIN.
 */
export type UpdateUserInput = {
  username?: string;
  email?: string;
  rol?: UserRole;
  /** URL de la foto de perfil. String vacío para volver al avatar por defecto. */
  url_avatar?: string;
};

/** Alta de una cuenta desde el panel de administración. */
export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  rol: UserRole;
};

export const userService = {
  /** Lista todos los usuarios. El backend lo restringe a ADMIN. */
  async list(): Promise<User[]> {
    const data = await httpClient.get<UserApiResponse[]>('/users');
    return data.map(toUser);
  },

  /** Da de alta una cuenta con el rol indicado. El backend lo restringe a ADMIN. */
  async create(input: CreateUserInput): Promise<User> {
    const data = await httpClient.post<UserApiResponse>('/users', input);
    return toUser(data);
  },

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

  /**
   * Da de baja una cuenta. Es una BAJA LÓGICA: el backend no borra el registro,
   * lo deja en estado 'suspended' y devuelve el usuario actualizado.
   */
  async suspend(id: number): Promise<User> {
    const data = await httpClient.delete<UserApiResponse>(`/users/${id}`);
    return toUser(data);
  },

  /** Reactiva una cuenta suspendida. El backend lo restringe a ADMIN. */
  async activate(id: number): Promise<User> {
    const data = await httpClient.patch<UserApiResponse>(`/users/${id}/activate`, {});
    return toUser(data);
  },
};
