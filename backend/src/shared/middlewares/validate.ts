// Middleware de validación de entrada con Zod.
// Se usa en las rutas, ANTES del controller:
//
//   router.post('/', validate({ body: createAlbumSchema }), albumController.create);
//   router.get('/', validate({ query: listAlbumsSchema }), albumController.findAll);
//
// Si la validación falla corta la request con 400 y el detalle campo por campo.
// Si pasa, deja los datos ya parseados y tipados en req.validated.
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { AppError } from '../errors/app-error';

type ValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

// Convierte los issues de Zod a un formato plano y legible para el frontend:
// [{ field: 'rating', message: 'El rating debe ser como máximo 5.' }]
function formatIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(raíz)',
    message: issue.message,
  }));
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = {};

    // Se validan las tres fuentes y se juntan TODOS los errores antes de responder,
    // así el usuario ve de una todos los campos mal en vez de uno por vez.
    const issues: { field: string; message: string }[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) req.validated.body = result.data;
      else issues.push(...formatIssues(result.error));
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) req.validated.params = result.data;
      else issues.push(...formatIssues(result.error));
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) req.validated.query = result.data;
      else issues.push(...formatIssues(result.error));
    }

    if (issues.length > 0) {
      next(new AppError('Los datos enviados no son válidos.', 400, issues));
      return;
    }

    next();
  };
}
