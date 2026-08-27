// Rutas del CRUD de álbumes, montadas en /api/albums.
//
//   POST   /api/albums             alta de un álbum, PRO o ADMIN
//   GET    /api/albums             listado del catálogo, cualquiera logueado
//   GET    /api/albums/:id         ficha del álbum con su tracklist, PÚBLICO
//   PATCH  /api/albums/:id         edita los datos, el que lo cargó o ADMIN
//   DELETE /api/albums/:id         elimina el álbum, solo ADMIN
//   PATCH  /api/albums/:id/approve aprueba un aporte pendiente, solo ADMIN
//   PATCH  /api/albums/:id/reject  rechaza un aporte pendiente, solo ADMIN
//
// El chequeo "dueño o admin" del PATCH depende de comparar el created_by del
// álbum contra el usuario del token, así que no lo puede resolver un middleware
// genérico: vive en el service. Lo mismo con el filtro por estado del listado,
// que solo un ADMIN puede elegir.
//
// La ficha es la única lectura pública, igual que las de género: se llega a ella
// desde /genres/:id, que es una página abierta a cualquiera. Por eso el service
// devuelve solo álbumes aprobados ahí. El listado sí pide token porque lo usan el
// panel de administración y la pestaña "Aportes" del perfil, que necesitan saber
// quién pregunta para decidir qué estados mostrar.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { albumController } from './album.controller';
import {
  albumIdParamSchema,
  createAlbumSchema,
  listAlbumsQuerySchema,
  updateAlbumSchema,
} from './album.schema';

export const albumRouter = Router();

albumRouter.post(
  '/',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ body: createAlbumSchema }),
  albumController.create
);

albumRouter.get(
  '/',
  requireAuth,
  validate({ query: listAlbumsQuerySchema }),
  albumController.list
);

albumRouter.get('/:id', validate({ params: albumIdParamSchema }), albumController.getById);

// Un FREE nunca puede ser dueño de un álbum (no puede darlos de alta), así que
// el rol se filtra acá y el service solo se ocupa de quién es el dueño.
albumRouter.patch(
  '/:id',
  requireAuth,
  requireRole('PRO', 'ADMIN'),
  validate({ params: albumIdParamSchema, body: updateAlbumSchema }),
  albumController.update
);

albumRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: albumIdParamSchema }),
  albumController.remove
);

albumRouter.patch(
  '/:id/approve',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: albumIdParamSchema }),
  albumController.approve
);

albumRouter.patch(
  '/:id/reject',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: albumIdParamSchema }),
  albumController.reject
);
