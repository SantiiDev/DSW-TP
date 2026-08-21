// Extiende el tipo Request de Express con las propiedades que le agregan
// nuestros middlewares:
//
//   - validated: los datos ya parseados por Zod (middleware validate).
//     Los controllers leen de acá y nunca de req.body / req.query crudos.
//   - user: el usuario autenticado que sale del JWT (middleware requireAuth).
//     Es opcional porque en una ruta pública no está definido.
import { TokenPayload } from '../shared/auth/jwt';

declare global {
  namespace Express {
    interface Request {
      validated: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
      user?: TokenPayload;
    }
  }
}

export {};
