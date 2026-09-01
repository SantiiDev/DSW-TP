// Rutas del CRUD de planes de membresía, montadas en /api/plans.
//
//   GET    /api/plans      listado de los planes, PÚBLICO
//   GET    /api/plans/:id  ficha de un plan, PÚBLICO
//   POST   /api/plans      alta de un plan, solo ADMIN
//   PATCH  /api/plans/:id  edita nombre, monto o descripción, solo ADMIN
//   DELETE /api/plans/:id  elimina el plan, solo ADMIN
//
// Mismo criterio que el CRUD de géneros: toda la escritura es de ADMIN y no hay
// circuito de moderación, porque un plan no es contenido que aporte un usuario
// sino la definición comercial del sistema. Como el permiso depende solo del rol,
// lo resuelve entero requireRole y al service no le queda ningún chequeo de
// acceso.
//
// Las dos lecturas son públicas porque la página /pro es lo primero que ve
// alguien que todavía no tiene cuenta, y es justamente donde hay que mostrarle
// cuánto sale la membresía. Un plan es un nombre, un precio y una descripción
// pensada para publicarse: no hay nada que proteger.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { planController } from './plan.controller';
import { createPlanSchema, planIdParamSchema, updatePlanSchema } from './plan.schema';

export const planRouter = Router();

planRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createPlanSchema }),
  planController.create
);

planRouter.get('/', planController.list);

planRouter.get('/:id', validate({ params: planIdParamSchema }), planController.getById);

planRouter.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: planIdParamSchema, body: updatePlanSchema }),
  planController.update
);

planRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: planIdParamSchema }),
  planController.remove
);
