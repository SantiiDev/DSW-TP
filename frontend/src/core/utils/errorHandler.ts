// Traducción de los errores de la API a algo que se le pueda mostrar al usuario.
//
// El backend responde SIEMPRE con el mismo formato de error:
//   { message: string, errors?: [{ field, message }] }
// Acá se lo envuelve en la clase ApiError para que cualquier componente pueda
// distinguir un error de negocio (401, 409, ...) de una caída de red, y nunca
// termine mostrando en pantalla un error crudo de JavaScript.

/** Detalle de un campo que no pasó la validación de Zod en el backend. */
export type FieldError = {
  field: string;
  message: string;
};

/** Status que se usa cuando la request nunca llegó a salir (no hay respuesta HTTP). */
export const NETWORK_ERROR_STATUS = 0;

const NETWORK_ERROR_MESSAGE =
  'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.';

const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo en unos minutos.';

/** Error de una llamada a la API. Lo lanza el httpClient y lo consumen los servicios. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: FieldError[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** true si la request ni siquiera llegó al servidor. */
  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }

  /** Arma el ApiError de una request que falló antes de tener respuesta. */
  static network(): ApiError {
    return new ApiError(NETWORK_ERROR_MESSAGE, NETWORK_ERROR_STATUS);
  }
}

/**
 * Devuelve el texto listo para mostrar en la UI a partir de cualquier error.
 *
 * Cuando el backend devuelve errores por campo (un 400 de validación) se los
 * suma al mensaje general: por sí solo, "Los datos enviados no son válidos"
 * no le dice al usuario qué tiene que corregir.
 *
 * @param error lo que haya caído en el catch (puede ser cualquier cosa).
 * @returns un mensaje en castellano, siempre apto para pantalla.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length === 0) return error.message;
    return [error.message, ...error.fieldErrors.map((fieldError) => fieldError.message)].join(' ');
  }

  // Cualquier otro error (un bug del frontend, por ejemplo) se muestra genérico:
  // el detalle técnico no le sirve al usuario y puede filtrar información.
  return UNEXPECTED_ERROR_MESSAGE;
}
