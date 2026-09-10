// Rutas del CRUD de canciones, montadas en /api/songs.
//
//   POST   /api/songs             alta de una canción, PRO o ADMIN
//   GET    /api/songs             listado del catálogo, cualquiera logueado
//   GET    /api/songs/explore     listado del explorador ordenado, PÚBLICO
//   GET    /api/songs/:id         ficha de una canción, PÚBLICO
//   PATCH  /api/songs/:id         edita los datos, la que la cargó o ADMIN
//   DELETE /api/songs/:id         elimina la canción, ADMIN o el autor si sigue pendiente
//   PATCH  /api/songs/:id/approve aprueba un aporte pendiente, solo ADMIN
//   PATCH  /api/songs/:id/reject  rechaza un aporte pendiente, solo ADMIN
//
// El chequeo "dueño o admin" del PATCH depende de comparar el created_by de la
// canción contra el usuario del token, así que no lo puede resolver un middleware
// genérico: vive en el service. Lo mismo con el filtro por estado del listado,
// que solo un ADMIN puede elegir.
//
// Hay DOS lecturas públicas, por el mismo motivo que en la feature album: las dos
// alimentan páginas abiertas a cualquiera. A la ficha se llega desde el tracklist
// de /albums/:id; el explorador es lo que dibuja las secciones de /music y la
// página de listado de canciones. Las dos devuelven solo contenido aprobado.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { songController } from './song.controller';
import {
  createSongSchema,
  exploreSongsQuerySchema,
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

// Va ANTES que /:id: Express prueba las rutas en orden, y si esta quedara
// después, "explore" entraría como si fuera un id y la validación lo rechazaría.
songRouter.get('/explore', validate({ query: exploreSongsQuerySchema }), songController.explore);

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

// El rol se filtra acá (un FREE nunca es dueño de una canción) y el service
// decide el resto: un ADMIN puede borrar cualquiera, y el que la cargó solo su
// propio aporte mientras siga pendiente de revisión.
songRouter.delete(
  '/:id',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
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
