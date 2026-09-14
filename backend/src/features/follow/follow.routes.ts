// Rutas del seguimiento entre usuarios, montadas en /api/users.
//
//   GET    /api/users/suggestions        a quiénes seguir, PÚBLICO
//   GET    /api/users/search?q=          buscar usuarios por nombre, PÚBLICO
//   POST   /api/users/:id/follow         empieza a seguir, logueado
//   DELETE /api/users/:id/follow         deja de seguir, logueado
//   GET    /api/users/:id/follow-stats   contadores de seguidores y seguidos, PÚBLICO
//   GET    /api/users/:id/followers      lista de quienes lo siguen, PÚBLICO
//   GET    /api/users/:id/following      lista de a quienes sigue, PÚBLICO
//
// Las URLs cuelgan de /users y no de un /follows propio porque seguir es una
// interacción CON UN USUARIO, igual que el "me gusta" es una interacción con una
// reseña y vive en /api/reviews/:id/like.
//
// La feature igual es una carpeta aparte de user/: así el trabajo del feed no
// toca ningún archivo del CRUD de usuarios y las dos ramas del equipo no se
// pisan. Es el mismo criterio con el que auth/ está separada de user/, aunque las
// dos trabajen sobre la misma tabla.
//
// Las lecturas son públicas porque /reviews es una vitrina: alguien sin cuenta ve
// el feed de la comunidad y el panel de gente real para seguir, y es justamente
// eso lo que lo invita a registrarse. Ninguna expone nada privado: los contadores
// y las listas son públicos en cualquier red social, y ninguna tarjeta de usuario
// incluye el email.
//
// Seguir y dejar de seguir son DOS endpoints y no un toggle como el "me gusta".
// El motivo está en follow.service.unfollow.
//
// "suggestions" y "search" van ANTES que cualquier ruta con :id por la razón de
// siempre, y además este router se monta antes que userRouter en routes.ts: si
// no, userRouter.get('/:id') tomaría "search" como si fuera un id.
import { Router } from 'express';
import { optionalAuth } from '../../shared/middlewares/optional-auth';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { followController } from './follow.controller';
import {
  followListQuerySchema,
  followParamsSchema,
  searchUsersQuerySchema,
  suggestedUsersQuerySchema,
} from './follow.schema';

export const followRouter = Router();

followRouter.get(
  '/suggestions',
  optionalAuth,
  validate({ query: suggestedUsersQuerySchema }),
  followController.suggestions
);

followRouter.get(
  '/search',
  optionalAuth,
  validate({ query: searchUsersQuerySchema }),
  followController.search
);

followRouter.get(
  '/:id/followers',
  optionalAuth,
  validate({ params: followParamsSchema, query: followListQuerySchema }),
  followController.followers
);

followRouter.get(
  '/:id/following',
  optionalAuth,
  validate({ params: followParamsSchema, query: followListQuerySchema }),
  followController.following
);

followRouter.post(
  '/:id/follow',
  requireAuth,
  validate({ params: followParamsSchema }),
  followController.follow
);

followRouter.delete(
  '/:id/follow',
  requireAuth,
  validate({ params: followParamsSchema }),
  followController.unfollow
);

followRouter.get(
  '/:id/follow-stats',
  optionalAuth,
  validate({ params: followParamsSchema }),
  followController.stats
);
