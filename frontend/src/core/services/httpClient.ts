// Cliente HTTP compartido por TODOS los servicios de las features.
// Ningún componente ni servicio usa fetch directo: siempre pasa por acá.
//
// Se encarga de tres cosas que si no habría que repetir en cada llamada:
//   1. armar la URL a partir de VITE_API_URL (nunca se hardcodea la URL de la API),
//   2. adjuntar el token de sesión en el header Authorization si el usuario está
//      logueado (el "interceptor": las features no se enteran de que existe un token),
//   3. convertir cualquier respuesta con error en un ApiError, así los servicios
//      solo se ocupan del caso feliz y la UI muestra siempre un mensaje entendible.
import { ApiError } from '../utils/errorHandler';
import type { FieldError } from '../utils/errorHandler';
import { tokenStorage } from './tokenStorage';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('Falta la variable VITE_API_URL. Copiá frontend/.env.example a frontend/.env.');
}

/** Forma del cuerpo de error que devuelve el backend. */
type ApiErrorBody = {
  message?: string;
  errors?: FieldError[];
};

/**
 * Hace una request a la API y devuelve el JSON ya parseado.
 *
 * @param method verbo HTTP.
 * @param path ruta relativa a la API, empezando con "/" (ej: '/auth/login').
 * @param body objeto a mandar como JSON; se omite en los GET.
 * @returns el cuerpo de la respuesta tipado como T.
 * @throws ApiError si la respuesta no es exitosa o si falla la conexión.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};

  // Interceptor: si hay sesión abierta, toda request sale firmada con el token.
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch solo rechaza si la request no llegó a destino (servidor caído, sin
    // internet, CORS). Un 404 o un 500 se resuelven bien y se manejan más abajo.
    throw ApiError.network();
  }

  // 204 No Content: la operación salió bien pero no hay cuerpo que parsear.
  if (response.status === 204) return null as T;

  // Si el cuerpo no es JSON válido se sigue de largo con null y decide el status.
  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = (data ?? {}) as ApiErrorBody;
    throw new ApiError(
      errorBody.message ?? 'No pudimos completar la operación.',
      response.status,
      Array.isArray(errorBody.errors) ? errorBody.errors : []
    );
  }

  return data as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
