// Rutas del pago de membresías, montadas en /api/payments.
//
//   POST /api/payments/checkout  arranca el pago de un plan, logueado
//   POST /api/payments/confirm   confirma el pago al volver del checkout, logueado
//   POST /api/payments/webhook   aviso de MercadoPago, PÚBLICO
//   GET  /api/payments/mine      mi historial de pagos, logueado
//
// El webhook es la única ruta del sistema sin requireAuth, y tiene que serlo: la
// llama un servidor de MercadoPago, que no tiene ni puede tener un token nuestro.
// Que sea pública no la vuelve insegura, porque no le cree nada a quien la llama:
// del aviso solo saca un id de pago y después le pregunta a MercadoPago, con
// nuestro access token, si ese pago existe y si está aprobado (ver
// payment.service.confirmPayment). Un POST inventado no activa ninguna membresía.
//
// Tampoco lleva validate(), por el mismo motivo: rechazar un aviso con formato
// raro lo dejaría reintentando para siempre (ver payment.schema.ts).
//
// No hay PATCH ni DELETE: un pago es un hecho que ya pasó y no se edita ni se
// borra. Es el registro contable del sistema, y de él depende el historial que ve
// el usuario.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { paymentController } from './payment.controller';
import { confirmPaymentSchema, createCheckoutSchema } from './payment.schema';

export const paymentRouter = Router();

paymentRouter.post(
  '/checkout',
  requireAuth,
  validate({ body: createCheckoutSchema }),
  paymentController.createCheckout
);

paymentRouter.post(
  '/confirm',
  requireAuth,
  validate({ body: confirmPaymentSchema }),
  paymentController.confirm
);

paymentRouter.post('/webhook', paymentController.webhook);

paymentRouter.get('/mine', requireAuth, paymentController.getMine);
