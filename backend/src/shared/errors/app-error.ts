// Errores de negocio de la aplicación.
// Los services lanzan estas clases y el middleware de manejo de errores las traduce
// al código HTTP y al formato de respuesta correspondiente. De este modo ningún
// controller arma respuestas de error a mano.

export class AppError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}

/** 400 - la request es inválida por una regla de negocio (no por el schema). */
export class BadRequestError extends AppError {
  constructor(message = 'Los datos enviados no son válidos.', details?: unknown) {
    super(message, 400, details);
  }
}

/** 401 - falta autenticación o el token es inválido. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Necesitás iniciar sesión para realizar esta acción.') {
    super(message, 401);
  }
}

/** 403 - está autenticado pero su rol no alcanza. */
export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permisos para realizar esta acción.') {
    super(message, 403);
  }
}

/** 404 - el recurso pedido no existe. */
export class NotFoundError extends AppError {
  constructor(resource = 'El recurso solicitado') {
    super(`${resource} no existe.`, 404);
  }
}

/** 409 - el recurso choca con otro existente (por ejemplo, un email repetido). */
export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe.', details?: unknown) {
    super(message, 409, details);
  }
}
