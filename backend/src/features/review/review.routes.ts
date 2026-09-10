// Rutas del CRUD de reseñas, montadas en /api/reviews.
//
//   GET    /api/reviews                          listado filtrado y paginado, PÚBLICO
//   GET    /api/reviews/mine                     mi reseña sobre un ítem, logueado
//   GET    /api/reviews/stats                    estadísticas de un usuario, PÚBLICO
//   GET    /api/reviews/:id                      detalle de una reseña, PÚBLICO
//   POST   /api/reviews                          publica una reseña, logueado
//   PATCH  /api/reviews/:id                      edita la propia, solo su autor
//   DELETE /api/reviews/:id                      elimina la reseña, su autor o ADMIN
//   PATCH  /api/reviews/:id/hide                 oculta una reseña, solo ADMIN
//   PATCH  /api/reviews/:id/restore              vuelve a publicarla, solo ADMIN
//   POST   /api/reviews/:id/like                 pone o saca el "me gusta", logueado
//   GET    /api/reviews/:id/comments             hilo de comentarios, PÚBLICO
//   POST   /api/reviews/:id/comments             comenta la reseña, logueado
//   DELETE /api/reviews/:id/comments/:idComment  borra un comentario, su autor o ADMIN
//
// El alta NO lleva requireRole, y es la diferencia clave con los CRUD de catálogo:
// reseñar es lo que hace cualquier usuario registrado, incluido un FREE. Lo que un
// FREE no puede es aportar artistas, álbumes o canciones.
//
// Los chequeos de "sos el autor" (PATCH) y "autor o admin" (DELETE) dependen de
// comparar el id_user de la reseña contra el del token, así que no los puede
// resolver un middleware genérico: viven en el service, igual que el "dueño o
// admin" del CRUD de álbumes.
//
// El listado y el detalle son los dos PÚBLICOS y los dos van con optionalAuth,
// que usa el token si viene pero no lo exige. Son públicos porque los dos son
// destino de un enlace que se comparte: el detalle es a donde lleva el botón de
// "compartir" de una reseña, y el listado es lo que dibuja el feed de la
// comunidad en /reviews, que se ve sin cuenta.
//
// Van con optionalAuth y no sin ningún middleware porque la respuesta mejora con
// sesión, en las dos:
//
//   - el corazón se dibuja lleno en las reseñas que ya le gustaron al que mira
//     (liked_by_me);
//   - una reseña oculta la siguen viendo su autor y un ADMIN; para el resto, 404;
//   - en el listado, un ADMIN puede además pedir las ocultas, y se habilita el
//     filtro following, que es el feed de amigos.
//
// Sin token nada de eso aplica y las dos rutas devuelven lo publicado.
import { Router } from 'express';
import { optionalAuth } from '../../shared/middlewares/optional-auth';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { reviewController } from './review.controller';
import {
  commentParamsSchema,
  createCommentSchema,
  createReviewSchema,
  listReviewsQuerySchema,
  myReviewQuerySchema,
  reviewIdParamSchema,
  reviewStatsQuerySchema,
  updateReviewSchema,
} from './review.schema';

export const reviewRouter = Router();

reviewRouter.post(
  '/',
  requireAuth,
  validate({ body: createReviewSchema }),
  reviewController.create
);

reviewRouter.get(
  '/',
  optionalAuth,
  validate({ query: listReviewsQuerySchema }),
  reviewController.list
);

// Van ANTES que /:id: Express prueba las rutas en orden, y si quedaran después,
// "mine" y "stats" entrarían como si fueran un id y la validación los rechazaría
// con un 400.
reviewRouter.get(
  '/mine',
  requireAuth,
  validate({ query: myReviewQuerySchema }),
  reviewController.mine
);

// Pública porque el perfil de un usuario se puede mirar sin cuenta: su histograma
// de calificaciones no expone nada que no muestre ya su listado de reseñas.
reviewRouter.get(
  '/stats',
  validate({ query: reviewStatsQuerySchema }),
  reviewController.stats
);

// Público, pero con optionalAuth: es el destino del enlace de "compartir", así
// que lo tiene que poder abrir cualquiera, y a la vez la respuesta cambia si
// además hay sesión (el corazón lleno, y ver la propia reseña aunque la hayan
// ocultado).
reviewRouter.get(
  '/:id',
  optionalAuth,
  validate({ params: reviewIdParamSchema }),
  reviewController.getById
);

reviewRouter.patch(
  '/:id',
  requireAuth,
  validate({ params: reviewIdParamSchema, body: updateReviewSchema }),
  reviewController.update
);

reviewRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: reviewIdParamSchema }),
  reviewController.remove
);

reviewRouter.patch(
  '/:id/hide',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: reviewIdParamSchema }),
  reviewController.hide
);

reviewRouter.patch(
  '/:id/restore',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: reviewIdParamSchema }),
  reviewController.restore
);

// --- Interacción con una reseña ---------------------------------------------
//
// Van anidadas bajo la reseña porque no existen sin ella, igual que
// /api/albums/:id/songs. Ninguna pide un rol: darle "me gusta" a una reseña y
// comentarla es lo que hace cualquier usuario registrado.

// Un solo endpoint para poner y sacar el "me gusta": el corazón es un
// interruptor, así que el frontend no tiene que saber en qué estado está.
reviewRouter.post(
  '/:id/like',
  requireAuth,
  validate({ params: reviewIdParamSchema }),
  reviewController.toggleLike
);

// El hilo es público, como el detalle de la reseña.
reviewRouter.get(
  '/:id/comments',
  validate({ params: reviewIdParamSchema }),
  reviewController.listComments
);

reviewRouter.post(
  '/:id/comments',
  requireAuth,
  validate({ params: reviewIdParamSchema, body: createCommentSchema }),
  reviewController.addComment
);

// El chequeo de "autor o admin" compara el id_user del comentario contra el del
// token, así que vive en el service.
reviewRouter.delete(
  '/:id/comments/:idComment',
  requireAuth,
  validate({ params: commentParamsSchema }),
  reviewController.removeComment
);
