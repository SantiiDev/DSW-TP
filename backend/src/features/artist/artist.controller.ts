// Controller del CRUD de artistas: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { artistService } from './artist.service';
import {
  ArtistIdParam,
  CreateArtistInput,
  ListArtistsQuery,
  SimilarArtistsQuery,
  UpdateArtistInput,
} from './artist.schema';

export const artistController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateArtistInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const artist = await artistService.create(data, req.user!);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(artist);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListArtistsQuery;
    const artists = await artistService.list(filters, req.user!);
    res.status(200).json(artists);
  },

  async findSimilar(req: Request, res: Response): Promise<void> {
    const { name, exclude_id } = req.validated.query as SimilarArtistsQuery;
    const artists = await artistService.findSimilar(name, exclude_id);
    res.status(200).json(artists);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ArtistIdParam;
    const artist = await artistService.getById(id);
    res.status(200).json(artist);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ArtistIdParam;
    const data = req.validated.body as UpdateArtistInput;
    const artist = await artistService.update(id, req.user!, data);
    res.status(200).json(artist);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ArtistIdParam;
    await artistService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  async approve(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ArtistIdParam;
    const artist = await artistService.approve(id);
    res.status(200).json(artist);
  },

  async reject(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ArtistIdParam;
    const artist = await artistService.reject(id);
    res.status(200).json(artist);
  },
};
