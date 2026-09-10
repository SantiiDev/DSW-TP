// Router principal de la API. Cada feature aporta su propio router y se monta acá
// bajo su prefijo. Es el índice de todos los endpoints del sistema.
import { Router } from 'express';
import { albumRouter } from './features/album/album.routes';
import { artistRouter } from './features/artist/artist.routes';
import { authRouter } from './features/auth/auth.routes';
import { followRouter } from './features/follow/follow.routes';
import { genreRouter } from './features/genre/genre.routes';
import { healthRouter } from './features/health/health.routes';
import { paymentRouter } from './features/payment/payment.routes';
import { planRouter } from './features/plan/plan.routes';
import { reviewRouter } from './features/review/review.routes';
import { songRouter } from './features/song/song.routes';
import { subscriptionRouter } from './features/subscription/subscription.routes';
import { userRouter } from './features/user/user.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
// El router de seguimiento va ANTES que el de usuarios, aunque los dos cuelguen
// de /users: Express prueba los routers en orden, y userRouter.get('/:id')
// tomaría /api/users/suggestions como si "suggestions" fuera un id, que la
// validación rechazaría con un 400. Es la misma regla de "las rutas literales
// antes de /:id", aplicada un nivel más arriba.
router.use('/users', followRouter);
router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/albums', albumRouter);
router.use('/songs', songRouter);
router.use('/genres', genreRouter);
router.use('/reviews', reviewRouter);
router.use('/plans', planRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/payments', paymentRouter);
