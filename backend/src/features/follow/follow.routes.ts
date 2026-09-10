// Rutas del seguimiento entre usuarios, montadas en /api/users.
//
//   GET    /api/users/suggestions        a quiénes seguir, PÚBLICO
//   POST   /api/users/:id/follow         empieza a seguir, logueado
//   DELETE /api/users/:id/follow         deja de seguir, logueado
//   GET    /api/users/:id/follow-stats   seguidores y seguidos, PÚBLICO
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
// Las dos lecturas son públicas porque /reviews es una vitrina: alguien sin
// cuenta ve el feed de la comunidad y el panel de gente real para seguir, y es
// justamente eso lo que lo invita a registrarse. Ninguna de las dos expone nada
// privado: los contadores son públicos y las sugerencias no incluyen el email.
//
// Seguir y dejar de seguir son DOS endpoints y no un toggle como el "me gusta".
// El motivo está en follow.service.unfollow.
//
// "suggestions" va ANTES que cualquier ruta con :id por la razón de siempre, y
// además este router se monta antes que userRouter en routes.ts: si no,
// userRouter.get('/:id') tomaría "suggestions" como si fuera un id.
import { Router } from 'express';
import { optionalAuth } from '../../shared/middlewares/optional-auth';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { followController } from './follow.controller';
import { followParamsSchema, suggestedUsersQuerySchema } from './follow.schema';

export const followRouter = Router();

followRouter.get(
  '/suggestions',
  optionalAuth,
  validate({ query: suggestedUsersQuerySchema }),
  followController.suggestions
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
