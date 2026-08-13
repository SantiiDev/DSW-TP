// Guarda el token de sesión en el navegador.
//
// Está aparte del httpClient y del AuthContext a propósito: los dos necesitan
// llegar al token (uno para mandarlo en cada request, el otro para recuperar la
// sesión al abrir la app) y así ninguno depende del otro.
//
// Se usa localStorage para que la sesión sobreviva a cerrar la pestaña, que es lo
// que espera cualquier usuario de un sitio como este.

const TOKEN_KEY = 'musicboxd_token';

export const tokenStorage = {
  /** Devuelve el token guardado, o null si no hay sesión. */
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  save(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};
