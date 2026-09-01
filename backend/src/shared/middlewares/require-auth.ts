// Middleware de autenticación.
//
// Se usa en las rutas que exigen estar logueado, antes del controller:
//
//   router.get('/me', requireAuth, userController.me);
//
// Espera el token en el header estándar `Authorization: Bearer <token>`.
// Si el token es válido deja el payload en req.user; si no, corta con 401.
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { verifyToken } from '../auth/jwt';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    // Se agrupan todos los motivos de fcdalla (vencido, firma inválida, texto
    // cualquiera) en un mismo 401: al cliente le alcanza con saber que tiene que
    // volver a iniciar sesión, y detallar el motivo solo le sirve a un atacante.
    next(new UnauthorizedError('Tu sesión expiró o no es válida. Iniciá sesión de nuevo.'));
  }
}
