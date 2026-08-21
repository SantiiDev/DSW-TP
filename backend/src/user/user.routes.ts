// Rutas del CRUD de usuarios, montadas en /api/users.
//
//   POST   /api/users             alta de una cuenta con rol elegido, solo ADMIN
//   GET    /api/users             listado completo, solo ADMIN
//   GET    /api/users/:id         perfil público de un usuario, cualquiera logueado
//   PATCH  /api/users/:id         actualiza username/email/rol, dueño o ADMIN
//   PATCH  /api/users/:id/status  activa o desactiva la cuenta, solo ADMIN
//   DELETE /api/users/:id         da de baja la cuenta, dueño de la cuenta o ADMIN
//
// Las bajas son lógicas: ni el DELETE ni el panel borran el registro, lo dejan
// con is_active = false. Ver el comentario de user.service.ts.
//
// El chequeo "dueño o admin" depende de comparar el :id contra el usuario del
// token, así que no lo puede resolver un middleware genérico: vive en el service.
// Lo mismo con el rol en el PATCH, que solo puede tocar un ADMIN.
import { Router } from 'express';
import { requireAuth } from '../shared/middlewares/require-auth';
import { requireRole } from '../shared/middlewares/require-role';
import { validate } from '../shared/middlewares/validate';
import { userController } from './user.controller';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from './user.schema';

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

// Va antes del DELETE por claridad, no por precedencia: '/:id/status' y '/:id'
// no se pisan entre sí porque tienen distinta cantidad de segmentos.
userRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: userIdParamSchema, body: updateUserStatusSchema }),
  userController.setActive
);

userRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: userIdParamSchema }),
  userController.remove
);
