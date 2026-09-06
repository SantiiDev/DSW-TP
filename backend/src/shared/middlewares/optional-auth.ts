// Middleware de autenticación OPCIONAL.
//
// Se usa en las rutas públicas cuya respuesta cambia si además hay sesión:
//
//   reviewRouter.get('/:id', optionalAuth, reviewController.getById);
//
// Es igual que requireAuth salvo en una cosa: NUNCA corta. Si no viene token,
// sigue de largo y el controller trabaja con req.user en undefined.
//
// El detalle de una reseña es el caso que lo justifica: cualquiera puede abrir el
// enlace que le compartieron, pero si el que lo abre tiene sesión hay dos cosas
// que solo se pueden saber con el token: si ya le dio "me gusta" (para dibujar el
// corazón lleno) y si es el autor o un ADMIN (para poder ver una reseña oculta).
// Con requireAuth el enlace compartido dejaría afuera a quien no tiene cuenta, y
// sin ningún middleware el que sí la tiene vería la reseña como un desconocido.
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/jwt';

const BEARER_PREFIX = 'Bearer ';

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next();
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  try {
    req.user = verifyToken(token);
  } catch {
    // Un token vencido o inválido se trata como si no hubiera venido ninguno, en
    // vez de responder 401: la ruta es pública, así que el pedido se puede
    // atender igual. Devolver un error dejaría sin ver una reseña pública a
    // alguien que simplemente tiene guardada una sesión vieja.
  }

  next();
}
