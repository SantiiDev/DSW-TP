// Controller del CRUD de canciones: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { songService } from './song.service';
import {
  CreateSongInput,
  ExploreSongsQuery,
  ListSongsQuery,
  SongIdParam,
  UpdateSongInput,
} from './song.schema';

export const songController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateSongInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const song = await songService.create(data, req.user!);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(song);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListSongsQuery;
    const songs = await songService.list(filters, req.user!);
    res.status(200).json(songs);
  },

  async explore(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ExploreSongsQuery;
    // Ruta pública: acá NO hay req.user, y el service devuelve siempre el
    // catálogo aprobado.
    const songs = await songService.explore(filters);
    res.status(200).json(songs);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as SongIdParam;
    // Ruta pública, igual que explore: acá tampoco hay req.user.
    const song = await songService.getPublicById(id);
    res.status(200).json(song);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as SongIdParam;
    const data = req.validated.body as UpdateSongInput;
    const song = await songService.update(id, req.user!, data);
    res.status(200).json(song);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as SongIdParam;
    await songService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  async approve(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as SongIdParam;
    const song = await songService.approve(id);
    res.status(200).json(song);
  },

  async reject(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as SongIdParam;
    const song = await songService.reject(id);
    res.status(200).json(song);
  },
};
