// Rutas del CRUD de listas personalizadas, montadas en /api/lists.
//
//   GET    /api/lists                      listado filtrado y paginado, PÚBLICO
//   GET    /api/lists/mine                 mis listas, logueado
//   GET    /api/lists/:id                  detalle con sus álbumes, PÚBLICO
//   POST   /api/lists                      crea una lista, logueado
//   PATCH  /api/lists/:id                  edita nombre/descripción, solo su dueño
//   DELETE /api/lists/:id                  elimina la lista, su dueño o ADMIN
//   POST   /api/lists/:id/albums           agrega un álbum, solo su dueño
//   DELETE /api/lists/:id/albums/:idAlbum  saca un álbum, solo su dueño
//   POST   /api/lists/:id/like             pone o saca el "me gusta", logueado
//
// El alta NO lleva requireRole: armar una lista es lo que hace cualquier usuario
// registrado, incluido un FREE, igual que reseñar. No hay circuito de moderación
// porque una lista no es contenido de catálogo (no lleva `state` en el DER): es
// una colección personal sobre álbumes que ya están aprobados.
//
// Las listas son SIEMPRE públicas, tal como quedó definido en la propuesta: no
// hay ningún endpoint que devuelva algo distinto según quién pregunta, salvo por
// `liked_by_me`, que es lo que justifica optionalAuth en las dos rutas de
// lectura (mismo criterio que el listado y el detalle de reviews).
//
// El chequeo de "sos el dueño" (PATCH, POST/DELETE de álbumes) y el de "dueño o
// admin" (DELETE de la lista) dependen de comparar el id_user de la lista contra
// el del token, así que no los puede resolver un middleware genérico: viven en
// el service, igual que en review y en album.
import { Router } from 'express';
import { optionalAuth } from '../../shared/middlewares/optional-auth';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { listController } from './list.controller';
import {
  addAlbumToListSchema,
  createListSchema,
  listAlbumParamsSchema,
  listIdParamSchema,
  listListsQuerySchema,
  updateListSchema,
} from './list.schema';

export const listRouter = Router();

listRouter.post('/', requireAuth, validate({ body: createListSchema }), listController.create);

listRouter.get('/', optionalAuth, validate({ query: listListsQuerySchema }), listController.list);

// Va ANTES que /:id: Express prueba las rutas en orden, y si quedara después,
// "mine" entraría como si fuera un id y la validación lo rechazaría con un 400.
listRouter.get('/mine', requireAuth, listController.mine);

listRouter.get(
  '/:id',
  optionalAuth,
  validate({ params: listIdParamSchema }),
  listController.getById
);

listRouter.patch(
  '/:id',
  requireAuth,
  validate({ params: listIdParamSchema, body: updateListSchema }),
  listController.update
);

listRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: listIdParamSchema }),
  listController.remove
);

// --- Álbumes de la lista -----------------------------------------------------
//
// Van anidados bajo la lista porque no existen sin ella, igual que
// /api/albums/:id/songs.

listRouter.post(
  '/:id/albums',
  requireAuth,
  validate({ params: listIdParamSchema, body: addAlbumToListSchema }),
  listController.addAlbum
);

listRouter.delete(
  '/:id/albums/:idAlbum',
  requireAuth,
  validate({ params: listAlbumParamsSchema }),
  listController.removeAlbum
);

// Un solo endpoint para poner y sacar el "me gusta": el corazón es un
// interruptor, así que el frontend no tiene que saber en qué estado está.
listRouter.post(
  '/:id/like',
  requireAuth,
  validate({ params: listIdParamSchema }),
  listController.toggleLike
);
