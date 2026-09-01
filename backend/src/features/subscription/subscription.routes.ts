// Rutas de las suscripciones, montadas en /api/subscriptions.
//
//   GET   /api/subscriptions             listado completo, solo ADMIN
//   GET   /api/subscriptions/mine        mi membresía vigente + historial, logueado
//   PATCH /api/subscriptions/mine/cancel da de baja mi membresía, logueado
//
// No hay POST: una suscripción no se crea a mano, nace del pago confirmado por la
// pasarela (ver payment.service). Tampoco hay DELETE: la baja es lógica, la
// suscripción queda como 'cancelled' porque es el historial de facturación del
// usuario y de ella cuelgan los pagos. Es el mismo criterio que la baja de un
// usuario en user.routes.ts.
//
// Las rutas de "mine" no llevan :id: el usuario sale del token. Es lo que hace
// imposible mirar o cancelar la membresía de otro, sin necesidad de un chequeo de
// "dueño o admin" en el service.
//
// "mine" va ANTES que cualquier ruta con parámetro por el mismo motivo que en
// review.routes.ts: Express prueba las rutas en orden.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { subscriptionController } from './subscription.controller';
import { listSubscriptionsQuerySchema } from './subscription.schema';

export const subscriptionRouter = Router();

subscriptionRouter.get('/mine', requireAuth, subscriptionController.getMine);

subscriptionRouter.patch('/mine/cancel', requireAuth, subscriptionController.cancelMine);

subscriptionRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ query: listSubscriptionsQuerySchema }),
  subscriptionController.list
);
