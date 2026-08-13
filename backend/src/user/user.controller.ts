// Controller del CRUD de usuarios: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { userService } from './user.service';
import { UpdateUserInput, UserIdParam } from './user.schema';

export const userController = {
  async list(_req: Request, res: Response): Promise<void> {
    const users = await userService.list();
    res.status(200).json(users);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    const user = await userService.getById(id);
    res.status(200).json(user);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    const data = req.validated.body as UpdateUserInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const user = await userService.update(id, req.user!, data);
    res.status(200).json(user);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    await userService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },
};
