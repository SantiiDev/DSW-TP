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
   * Activa o desactiva la cuenta de un usuario (baja lógica). El backend lo
   * restringe a ADMIN y no deja que se desactive a sí mismo.
   * @param id usuario a activar o desactivar.
   * @param isActive true para reactivar la cuenta, false para darla de baja.
   */
  async setActive(id: number, isActive: boolean): Promise<User> {
    const data = await httpClient.patch<UserApiResponse>(`/users/${id}/status`, {
      is_active: isActive,
    });
    return toUser(data);
  },

  /**
   * Da de baja la cuenta de un usuario. La baja es lógica: el registro no se
   * borra, queda inactivo y un admin lo puede reactivar.
   */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/users/${id}`);
  },
};
