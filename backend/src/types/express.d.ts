// Extiende el tipo Request de Express para agregar la propiedad `validated`,
// donde el middleware de validación deja los datos ya parseados por Zod.
// Los controllers leen de acá y nunca de req.body / req.query crudos.

declare global {
  namespace Express {
    interface Request {
      validated: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
