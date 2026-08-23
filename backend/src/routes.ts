// Router principal de la API. Cada feature aporta su propio router y se monta acá
// bajo su prefijo. Es el índice de todos los endpoints del sistema.
import { Router } from 'express';
import { artistRouter } from './features/artist/artist.routes';
import { authRouter } from './features/auth/auth.routes';
import { genreRouter } from './features/genre/genre.routes';
import { healthRouter } from './features/health/health.routes';
import { userRouter } from './features/user/user.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/genres', genreRouter);

// A medida que avancen las features se van montando acá:
// router.use('/albums', albumRouter);
// router.use('/songs', songRouter);
// router.use('/reviews', reviewRouter);
// router.use('/plans', planRouter);
// router.use('/subscriptions', subscriptionRouter);
// router.use('/payments', paymentRouter);
