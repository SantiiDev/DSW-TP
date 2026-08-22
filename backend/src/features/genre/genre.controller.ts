// Controller del CRUD de géneros: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { genreService } from './genre.service';
import {
  CreateGenreInput,
  GenreIdParam,
  ListGenresQuery,
  UpdateGenreInput,
} from './genre.schema';

export const genreController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateGenreInput;
    const genre = await genreService.create(data);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(genre);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListGenresQuery;
    const genres = await genreService.list(filters);
    res.status(200).json(genres);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as GenreIdParam;
    const genre = await genreService.getById(id);
    res.status(200).json(genre);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as GenreIdParam;
    const data = req.validated.body as UpdateGenreInput;
    const genre = await genreService.update(id, data);
    res.status(200).json(genre);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as GenreIdParam;
    await genreService.remove(id);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },
};
