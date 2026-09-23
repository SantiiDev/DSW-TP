// Rutas de las suscripciones, montadas en /api/subscriptions.
//
//   GET /api/subscriptions       listado completo, solo ADMIN
//   GET /api/subscriptions/mine  mi membresía vigente + historial, logueado
//
// Son las dos únicas: una suscripción no se crea ni se da de baja por esta API.
//
//  - No nace a mano: la crea el pago confirmado por la pasarela (payment.service).
//  - No se da de baja: la membresía Pro es un pago único vitalicio, así que el
//    usuario no tiene nada que cancelar. La única baja posible es la que aplica un
//    ADMIN cambiándole el rol al usuario desde el CRUD de usuarios, y ahí la fila
//    queda como 'cancelled' —nunca borrada— porque es el historial de facturación
//    y de ella cuelgan los pagos. Es el mismo criterio que la baja de un usuario
//    en user.routes.ts.
//
// La ruta "mine" no lleva :id: el usuario sale del token. Es lo que hace imposible
// mirar la membresía de otro, sin necesidad de un chequeo de "dueño o admin" en el
// service.
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

subscriptionRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ query: listSubscriptionsQuerySchema }),
  subscriptionController.list
);
