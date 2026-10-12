// Rutas del CRUD de artistas, montadas en /api/artists.
//
//   POST   /api/artists             alta de un artista, PRO o ADMIN
//   GET    /api/artists             listado del catálogo, cualquiera logueado
//   GET    /api/artists/similar     nombres parecidos a uno dado, para avisar
//                                   antes de cargar un artista repetido
//   GET    /api/artists/:id         ficha de un artista, cualquiera logueado
//   PATCH  /api/artists/:id         edita nombre y biografía, el que lo cargó o ADMIN
//   DELETE /api/artists/:id         elimina el artista, ADMIN o el autor si sigue pendiente
//   PATCH  /api/artists/:id/approve aprueba un aporte pendiente, solo ADMIN
//   PATCH  /api/artists/:id/reject  rechaza un aporte pendiente, solo ADMIN
//
// El chequeo "dueño o admin" del PATCH depende de comparar el created_by del
// artista contra el usuario del token, así que no lo puede resolver un middleware
// genérico: vive en el service. Lo mismo con el filtro por estado del listado,
// que solo un ADMIN puede elegir.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { artistController } from './artist.controller';
import {
  artistIdParamSchema,
  createArtistSchema,
  listArtistsQuerySchema,
  similarArtistsQuerySchema,
  updateArtistSchema,
} from './artist.schema';

export const artistRouter = Router();

artistRouter.post(
  '/',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ body: createArtistSchema }),
  artistController.create
);

artistRouter.get(
  '/',
  requireAuth,
  validate({ query: listArtistsQuerySchema }),
  artistController.list
);

// Va ANTES que /:id: Express prueba las rutas en orden, y si esta quedara
// después, "similar" entraría como si fuera un id y la validación lo rechazaría.
artistRouter.get(
  '/similar',
  requireAuth,
  validate({ query: similarArtistsQuerySchema }),
  artistController.findSimilar
);

artistRouter.get(
  '/:id',
  requireAuth,
  validate({ params: artistIdParamSchema }),
  artistController.getById
);

// Un FREE nunca puede ser dueño de un artista (no puede darlos de alta), así que
// el rol se filtra acá y el service solo se ocupa de quién es el dueño.
artistRouter.patch(
  '/:id',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ params: artistIdParamSchema, body: updateArtistSchema }),
  artistController.update
);

// El rol se filtra acá (un FREE nunca es dueño de un artista) y el service
// decide el resto: un ADMIN puede borrar cualquiera, y el que lo cargó solo su
// propio aporte mientras siga pendiente de revisión.
artistRouter.delete(
  '/:id',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ params: artistIdParamSchema }),
  artistController.remove
);

artistRouter.patch(
  '/:id/approve',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: artistIdParamSchema }),
  artistController.approve
);

artistRouter.patch(
  '/:id/reject',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: artistIdParamSchema }),
  artistController.reject
);
