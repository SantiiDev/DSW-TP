// Rutas de autenticación, montadas en /api/auth.
//
//   POST /api/auth/register   alta de cuenta (siempre con rol FREE)
//   POST /api/auth/login      inicio de sesión, devuelve el token
//   GET  /api/auth/me         datos del usuario logueado
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.get('/me', requireAuth, authController.me);
