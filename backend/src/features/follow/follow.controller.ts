// Controller del seguimiento entre usuarios: traduce HTTP <-> service. No
// consulta la base ni arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { followService } from './follow.service';
import {
  FollowListQuery,
  FollowParams,
  RankingQuery,
  SearchUsersQuery,
  SuggestedUsersQuery,
} from './follow.schema';

export const followController = {
  async follow(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as FollowParams;
    const stats = await followService.follow(id, req.user!);
    // 201: la request creó un recurso nuevo (la fila de follows).
    res.status(201).json(stats);
  },

  async unfollow(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as FollowParams;
    await followService.unfollow(id, req.user!);
    // 204: la baja fue exitosa y no hay contenido que devolver.
    res.status(204).send();
  },

  // Las lecturas van con optionalAuth, así que req.user puede no estar: se pasa
  // null y el service responde como para un visitante.
  async stats(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as FollowParams;
    const stats = await followService.stats(id, req.user ?? null);
    res.status(200).json(stats);
  },

  async suggestions(req: Request, res: Response): Promise<void> {
    const query = req.validated.query as SuggestedUsersQuery;
    const users = await followService.suggestions(query, req.user ?? null);
    res.status(200).json(users);
  },

  async ranking(req: Request, res: Response): Promise<void> {
    const query = req.validated.query as RankingQuery;
    const users = await followService.ranking(query, req.user ?? null);
    res.status(200).json(users);
  },

  async search(req: Request, res: Response): Promise<void> {
    const query = req.validated.query as SearchUsersQuery;
    const users = await followService.search(query, req.user ?? null);
    res.status(200).json(users);
  },

  async followers(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as FollowParams;
    const query = req.validated.query as FollowListQuery;
    const users = await followService.followers(id, query, req.user ?? null);
    res.status(200).json(users);
  },

  async following(req: Request, res: Response): Promise<void> {
    const { id } = req.validated.params as FollowParams;
    const query = req.validated.query as FollowListQuery;
    const users = await followService.following(id, query, req.user ?? null);
    res.status(200).json(users);
  },
};
