// Controller del CRUD de álbumes: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { albumService } from './album.service';
import { AlbumIdParam, CreateAlbumInput, ListAlbumsQuery, UpdateAlbumInput } from './album.schema';

export const albumController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateAlbumInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const album = await albumService.create(data, req.user!);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(album);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListAlbumsQuery;
    const albums = await albumService.list(filters, req.user!);
    res.status(200).json(albums);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AlbumIdParam;
    // Es la única ruta pública de la feature, así que acá NO hay req.user.
    const album = await albumService.getPublicById(id);
    res.status(200).json(album);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AlbumIdParam;
    const data = req.validated.body as UpdateAlbumInput;
    const album = await albumService.update(id, req.user!, data);
    res.status(200).json(album);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AlbumIdParam;
    await albumService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  async approve(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AlbumIdParam;
    const album = await albumService.approve(id);
    res.status(200).json(album);
  },

  async reject(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as AlbumIdParam;
    const album = await albumService.reject(id);
    res.status(200).json(album);
  },
};
