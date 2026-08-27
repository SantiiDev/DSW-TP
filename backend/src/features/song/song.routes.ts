// Rutas del CRUD de canciones, montadas en /api/songs.
//
//   POST   /api/songs             alta de una canción, PRO o ADMIN
//   GET    /api/songs             listado del catálogo, cualquiera logueado
//   GET    /api/songs/:id         ficha de una canción, PÚBLICO
//   PATCH  /api/songs/:id         edita los datos, la que la cargó o ADMIN
//   DELETE /api/songs/:id         elimina la canción, solo ADMIN
//   PATCH  /api/songs/:id/approve aprueba un aporte pendiente, solo ADMIN
//   PATCH  /api/songs/:id/reject  rechaza un aporte pendiente, solo ADMIN
//
// El chequeo "dueño o admin" del PATCH depende de comparar el created_by de la
// canción contra el usuario del token, así que no lo puede resolver un middleware
// genérico: vive en el service. Lo mismo con el filtro por estado del listado,
// que solo un ADMIN puede elegir.
//
// La ficha es la única lectura pública, por el mismo motivo que la de álbum: se
// llega a ella desde el tracklist de /albums/:id, que es una página abierta. Por
// eso el service devuelve solo canciones aprobadas ahí.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { songController } from './song.controller';
import {
  createSongSchema,
  listSongsQuerySchema,
  songIdParamSchema,
  updateSongSchema,
} from './song.schema';

export const songRouter = Router();

songRouter.post(
  '/',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ body: createSongSchema }),
  songController.create
);

songRouter.get('/', requireAuth, validate({ query: listSongsQuerySchema }), songController.list);

songRouter.get('/:id', validate({ params: songIdParamSchema }), songController.getById);

// Un FREE nunca puede ser dueño de una canción (no puede darlas de alta), así que
// el rol se filtra acá y el service solo se ocupa de quién es el dueño.
songRouter.patch(
  '/:id',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ params: songIdParamSchema, body: updateSongSchema }),
  songController.update
);

songRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: songIdParamSchema }),
  songController.remove
);

songRouter.patch(
  '/:id/approve',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: songIdParamSchema }),
  songController.approve
);

songRouter.patch(
  '/:id/reject',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: songIdParamSchema }),
  songController.reject
);
