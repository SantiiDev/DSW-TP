// Controller del CRUD de reseñas: traduce HTTP <-> service. No consulta la base
// ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { reviewService } from './review.service';
import {
  CommentParams,
  CreateCommentInput,
  CreateReviewInput,
  ListReviewsQuery,
  MyReviewQuery,
  ReviewIdParam,
  ReviewStatsQuery,
  UpdateReviewInput,
} from './review.schema';

export const reviewController = {
  async create(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as CreateReviewInput;
    // requireAuth garantiza que req.user esté seteado antes de llegar acá.
    const review = await reviewService.create(data, req.user!);
    // 201: la request creó un recurso nuevo.
    res.status(201).json(review);
  },

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.validated.query as ListReviewsQuery;
    const reviews = await reviewService.list(filters, req.user!);
    res.status(200).json(reviews);
  },

  async mine(req: Request, res: Response): Promise<void> {
    const query = req.validated.query as MyReviewQuery;
    const review = await reviewService.getMine(query, req.user!);
    // 200 con null cuando todavía no reseñó ese ítem: no es un error, es la
    // respuesta a "¿ya lo reseñé?". Un 404 obligaría al frontend a tratar el caso
    // normal como una falla.
    res.status(200).json(review);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    // Ruta pública: acá NO hay req.user, y el service devuelve solo lo publicado.
    const review = await reviewService.getById(id);
    res.status(200).json(review);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const data = req.validated.body as UpdateReviewInput;
    const review = await reviewService.update(id, req.user!, data);
    res.status(200).json(review);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    await reviewService.remove(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  async hide(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const review = await reviewService.hide(id, req.user!);
    res.status(200).json(review);
  },

  async restore(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const review = await reviewService.restore(id, req.user!);
    res.status(200).json(review);
  },

  async stats(req: Request, res: Response): Promise<void> {
    const { id_user } = req.validated.query as ReviewStatsQuery;
    // Ruta pública: las estadísticas de un perfil las ve cualquiera.
    const stats = await reviewService.stats(id_user);
    res.status(200).json(stats);
  },

  async toggleLike(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const review = await reviewService.toggleLike(id, req.user!);
    // 200 y no 201: el corazón es un interruptor, así que la misma request a veces
    // crea la fila y a veces la borra. Devuelve la reseña con el conteo al día.
    res.status(200).json(review);
  },

  async listComments(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const comments = await reviewService.listComments(id);
    res.status(200).json(comments);
  },

  async addComment(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as ReviewIdParam;
    const data = req.validated.body as CreateCommentInput;
    const comment = await reviewService.addComment(id, data, req.user!);
    res.status(201).json(comment);
  },

  async removeComment(req: Request, res: Response): Promise<void> {
    const { idComment } = req.validated.params as CommentParams;
    await reviewService.removeComment(idComment, req.user!);
    res.status(204).send();
  },
};
