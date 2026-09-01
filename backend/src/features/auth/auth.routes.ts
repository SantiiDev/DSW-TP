// Rutas de autenticación, montadas en /api/auth.
//
//   POST /api/auth/register   alta de cuenta (siempre con rol FREE)
//   POST /api/auth/login      inicio de sesión, devuelve el token
//   POST /api/auth/refresh    token nuevo con el rol actualizado, logueado
//   GET  /api/auth/me         datos del usuario logueado
//
// /refresh existe porque el rol viaja dentro del token: al pasar a PRO hay que
// emitir uno nuevo, si no el backend sigue viendo un FREE (ver auth.service).
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { validate } from '../../shared/middlewares/validate';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', requireAuth, authController.refresh);
authRouter.get('/me', requireAuth, authController.me);
