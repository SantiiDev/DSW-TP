// Controller de las suscripciones: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
//
// Las dos rutas de "mi membresía" sacan el usuario de req.user y NO de la URL:
// es lo que garantiza que nadie pueda mirar ni dar de baja la membresía de otro.
import { Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors/app-error';
import { subscriptionService } from './subscription.service';
import { ListSubscriptionsQuery } from './subscription.schema';

export const subscriptionController = {
  async getMine(req: Request, res: Response): Promise<void> {
    // requireAuth ya dejó el usuario en req.user; el chequeo es para TypeScript,
    // que no puede saber que la ruta lleva ese middleware adelante.
    if (!req.user) throw new UnauthorizedError();

    const membership = await subscriptionService.getMine(req.user.id_user, req.user.rol);
    res.status(200).json(membership);
  },

  async cancelMine(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();

    const cancelled = await subscriptionService.cancelMine(req.user.id_user, req.user.rol);
    res.status(200).json(cancelled);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListSubscriptionsQuery;
    const subscriptions = await subscriptionService.list(filters);
    res.status(200).json(subscriptions);
  },
};
