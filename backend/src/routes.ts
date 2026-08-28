// Router principal de la API. Cada feature aporta su propio router y se monta acá
// bajo su prefijo. Es el índice de todos los endpoints del sistema.
import { Router } from 'express';
import { albumRouter } from './features/album/album.routes';
import { artistRouter } from './features/artist/artist.routes';
import { authRouter } from './features/auth/auth.routes';
import { genreRouter } from './features/genre/genre.routes';
import { healthRouter } from './features/health/health.routes';
import { reviewRouter } from './features/review/review.routes';
import { songRouter } from './features/song/song.routes';
import { userRouter } from './features/user/user.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/albums', albumRouter);
router.use('/songs', songRouter);
router.use('/genres', genreRouter);
router.use('/reviews', reviewRouter);

// A medida que avancen las features se van montando acá:
// router.use('/plans', planRouter);
// router.use('/subscriptions', subscriptionRouter);
// router.use('/payments', paymentRouter);
