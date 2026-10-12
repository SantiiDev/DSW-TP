// Middleware de autorización por rol.
//
// Va SIEMPRE después de requireAuth, que es el que deja el usuario en req.user:
//
//   router.post('/', requireAuth, requireRole('PRO', 'ADMIN'), albumController.create);
//   router.patch('/:id/approve', requireAuth, requireRole('ADMIN'), albumController.approve);
//
// Los niveles de acceso del sistema son FREE | PRO | ADMIN (ver
// shared/types/enums.ts). El frontend replica esta protección con ProtectedRoute,
// pero la validación real es esta: la del backend.
import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';
import { UserRole } from '../types/enums';

/**
 * Restringe una ruta a los roles indicados.
 * @param roles roles habilitados; alcanza con tener uno de ellos.
 * @returns el middleware de Express que hace el chequeo.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Si falta req.user es porque la ruta se armó sin requireAuth adelante.
    // Se responde 401 (falta autenticarse) y no 403 (rol insuficiente).
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.rol)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
