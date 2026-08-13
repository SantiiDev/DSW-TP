// Servicio de autenticación: centraliza las llamadas HTTP de /api/auth y mapea
// la respuesta cruda del backend al modelo User.
//
// Es el único lugar del frontend que conoce la forma del JSON de la API.
import { httpClient } from '../../../core/services/httpClient';
import { User } from '../models/User';
import type { UserApiResponse } from '../models/User';

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

/** Lo que devuelve un login o un registro exitoso: el usuario y su token. */
export type AuthSession = {
  user: User;
  token: string;
};

/** Respuesta cruda de POST /auth/register y POST /auth/login. */
type AuthApiResponse = {
  user: UserApiResponse;
  token: string;
};

// Pasa el JSON del backend al modelo: renombra los campos a la convención del
// frontend (camelCase) y convierte la fecha, que viaja como texto ISO.
function toUser(data: UserApiResponse): User {
  return new User(
    data.id_user,
    data.username,
    data.email,
    data.rol,
    new Date(data.registration_date)
  );
}

function toSession(data: AuthApiResponse): AuthSession {
  return { user: toUser(data.user), token: data.token };
}

export const authService = {
  /** Da de alta una cuenta nueva (siempre con rol FREE) y devuelve la sesión ya iniciada. */
  async register(input: RegisterInput): Promise<AuthSession> {
    const data = await httpClient.post<AuthApiResponse>('/auth/register', input);
    return toSession(data);
  },

  /** Valida las credenciales contra el backend y devuelve la sesión. */
  async login(input: LoginInput): Promise<AuthSession> {
    const data = await httpClient.post<AuthApiResponse>('/auth/login', input);
    return toSession(data);
  },

  /**
   * Devuelve el usuario dueño del token que el httpClient manda automáticamente.
   * Se usa al abrir la app para saber si la sesión guardada sigue siendo válida.
   */
  async getCurrentUser(): Promise<User> {
    const data = await httpClient.get<UserApiResponse>('/auth/me');
    return toUser(data);
  },
};
