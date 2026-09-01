// Controller del CRUD de planes: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { planService } from './plan.service';
import { CreatePlanInput, PlanIdParam, UpdatePlanInput } from './plan.schema';

export const planController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreatePlanInput;
    const plan = await planService.create(data);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(plan);
  },

  // El listado no recibe filtros, así que no lee nada de la request.
  async list(_req: Request, res: Response): Promise<void> {
    const plans = await planService.list();
    res.status(200).json(plans);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as PlanIdParam;
    const plan = await planService.getById(id);
    res.status(200).json(plan);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as PlanIdParam;
    const data = req.validated.body as UpdatePlanInput;
    const plan = await planService.update(id, data);
    res.status(200).json(plan);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as PlanIdParam;
    await planService.remove(id);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },
};
