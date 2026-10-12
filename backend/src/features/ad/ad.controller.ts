// Controller del CRUD de anuncios: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { adService } from './ad.service';
import { AdIdParam, CreateAdInput, UpdateAdInput } from './ad.schema';

export const adController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateAdInput;
    const ad = await adService.create(data);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(ad);
  },

  // Todos los anuncios: es el listado del panel de administración.
  async list(_req: Request, res: Response): Promise<void> {
    const ads = await adService.list();
    res.status(200).json(ads);
  },

  // Solo los que están en circulación: es lo que pide el panel lateral.
  async listActive(_req: Request, res: Response): Promise<void> {
    const ads = await adService.listActive();
    res.status(200).json(ads);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AdIdParam;
    const data = req.validated.body as UpdateAdInput;
    const ad = await adService.update(id, data);
    res.status(200).json(ad);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AdIdParam;
    await adService.remove(id);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },
};
