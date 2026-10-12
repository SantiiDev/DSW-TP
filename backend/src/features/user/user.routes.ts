// Rutas del CRUD de usuarios, montadas en /api/users.
//
//   POST   /api/users              alta de una cuenta con rol elegido, solo ADMIN
//   GET    /api/users              listado completo, solo ADMIN
//   GET    /api/users/:id          perfil público de un usuario, cualquiera logueado
//   PATCH  /api/users/:id          actualiza username/email/rol/state, dueño o ADMIN
//   DELETE /api/users/:id          BAJA LÓGICA: suspende la cuenta, dueño o ADMIN
//   PATCH  /api/users/:id/activate reactiva una cuenta suspendida, solo ADMIN
//
// El DELETE no borra la fila: deja al usuario en state = 'suspended' (ver
// user.service.suspend). Por eso hay un endpoint para el camino inverso.
//
// El chequeo "dueño o admin" depende de comparar el :id contra el usuario del
// token, así que no lo puede resolver un middleware genérico: vive en el service.
// Lo mismo con el rol y el estado en el PATCH, que solo puede tocar un ADMIN.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { userController } from './user.controller';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';

export const userRouter = Router();

userRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createUserSchema }),
  userController.create
);

userRouter.get('/', requireAuth, requireRole('ADMIN'), userController.list);

userRouter.get(
  '/:id',
  requireAuth,
  validate({ params: userIdParamSchema }),
  userController.getById
);

userRouter.patch(
  '/:id',
  requireAuth,
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  userController.update
);

userRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: userIdParamSchema }),
  userController.suspend
);

// Reactivar es una acción de moderación: no la puede pedir el dueño de la cuenta
// (que además no podría loguearse para hacerlo), solo un ADMIN.
userRouter.patch(
  '/:id/activate',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: userIdParamSchema }),
  userController.activate
);
