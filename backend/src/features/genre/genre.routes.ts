// Rutas del CRUD de géneros, montadas en /api/genres.
//
//   GET    /api/genres      listado del catálogo, PÚBLICO
//   GET    /api/genres/:id  ficha de un género con sus álbumes, PÚBLICO
//   POST   /api/genres      alta de un género, solo ADMIN
//   PATCH  /api/genres/:id  renombra el género, solo ADMIN
//   DELETE /api/genres/:id  elimina el género, solo ADMIN
//
// Toda la escritura es de ADMIN y no hay circuito de moderación: el género no es
// contenido aportable por un usuario PRO (por eso GENRES no tiene state ni
// created_by en el DER), sino la taxonomía con la que se ordena el catálogo.
// Como el permiso depende solo del rol, lo resuelve entero requireRole y al
// service no le queda ningún chequeo de acceso.
//
// Las dos lecturas son la excepción al criterio del CRUD de artista, donde hasta
// listar pide token: el explorador de música (/music) es una página pública y su
// grilla de géneros es lo primero que ve alguien que todavía no tiene cuenta.
// Un género es un nombre y nada más, así que no hay nada que proteger.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { genreController } from './genre.controller';
import {
  createGenreSchema,
  genreIdParamSchema,
  listGenresQuerySchema,
  updateGenreSchema,
} from './genre.schema';

export const genreRouter = Router();

genreRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createGenreSchema }),
  genreController.create
);

genreRouter.get('/', validate({ query: listGenresQuerySchema }), genreController.list);

genreRouter.get('/:id', validate({ params: genreIdParamSchema }), genreController.getById);

genreRouter.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: genreIdParamSchema, body: updateGenreSchema }),
  genreController.update
);

genreRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: genreIdParamSchema }),
  genreController.remove
);
