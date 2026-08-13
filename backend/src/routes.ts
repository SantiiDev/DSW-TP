// Router principal de la API. Cada feature aporta su propio router y se monta acá
// bajo su prefijo. Es el índice de todos los endpoints del sistema.
import { Router } from 'express';
import { authRouter } from './auth/auth.routes';
import { healthRouter } from './health/health.routes';
import { userRouter } from './user/user.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);

// A medida que avancen las features se van montando acá:
// router.use('/artists', artistRouter);
// router.use('/genres', genreRouter);
// router.use('/albums', albumRouter);
// router.use('/songs', songRouter);
// router.use('/reviews', reviewRouter);
// router.use('/plans', planRouter);
// router.use('/subscriptions', subscriptionRouter);
// router.use('/payments', paymentRouter);
