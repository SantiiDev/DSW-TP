// Controller del CRUD de usuarios: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { userService } from './user.service';
import { CreateUserInput, UpdateUserInput, UserIdParam } from './user.schema';

export const userController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateUserInput;
    const user = await userService.create(data);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(user);
  },

  async list(_req: Request, res: Response): Promise<void> {
    const users = await userService.list();
    res.status(200).json(users);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const user = await userService.getById(id, req.user!);
    res.status(200).json(user);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    const data = req.validated.body as UpdateUserInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const user = await userService.update(id, req.user!, data);
    res.status(200).json(user);
  },

  // Baja lógica: la cuenta queda suspendida, no se borra.
  // Devuelve 200 con el usuario ya suspendido (y no 204) porque el panel de
  // administración necesita el estado nuevo para redibujar la fila.
  async suspend(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    const user = await userService.suspend(id, req.user!);
    res.status(200).json(user);
  },

  async activate(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as UserIdParam;
    const user = await userService.activate(id);
    res.status(200).json(user);
  },
};
