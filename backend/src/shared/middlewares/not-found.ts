// Middleware para rutas inexistentes. Va después de todas las rutas y antes del
// errorHandler, para que un endpoint mal escrito devuelva un 404 con el formato
// de error de la API y no el HTML por defecto de Express.
import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors/app-error';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`La ruta ${req.method} ${req.originalUrl}`));
}
