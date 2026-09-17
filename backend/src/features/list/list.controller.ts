// Controller del CRUD de listas: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { listService } from './list.service';
import {
  AddAlbumToListInput,
  CreateListInput,
  ListAlbumParams,
  ListIdParam,
  ListListsQuery,
  UpdateListInput,
} from './list.schema';

export const listController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateListInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const list = await listService.create(data, req.user!);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(list);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListListsQuery;
    // Va con optionalAuth: req.user puede no estar, y el service responde como
    // para un visitante (liked_by_me siempre en false).
    const lists = await listService.list(filters, req.user ?? null);
    res.status(200).json(lists);
  },

  async mine(req: Request, res: Response): Promise<void> {
    const lists = await listService.listMine(req.user!);
    res.status(200).json(lists);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ListIdParam;
    const list = await listService.getById(id, req.user ?? null);
    res.status(200).json(list);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ListIdParam;
    const data = req.validated.body as UpdateListInput;
    const list = await listService.update(id, req.user!, data);
    res.status(200).json(list);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ListIdParam;
    await listService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  async addAlbum(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ListIdParam;
    const data = req.validated.body as AddAlbumToListInput;
    const list = await listService.addAlbum(id, data, req.user!);
    res.status(201).json(list);
  },

  async removeAlbum(req: Request, res: Response): Promise<void> {
    const { id, idAlbum } = req.validated.params as ListAlbumParams;
    const list = await listService.removeAlbum(id, idAlbum, req.user!);
    res.status(200).json(list);
  },

  async toggleLike(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ListIdParam;
    // 200 y no 201: el corazón es un interruptor, así que la misma request a
    // veces crea la fila y a veces la borra.
    const list = await listService.toggleLike(id, req.user!);
    res.status(200).json(list);
  },
};
