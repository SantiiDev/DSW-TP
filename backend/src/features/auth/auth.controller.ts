// Controller de autenticación: traduce HTTP <-> service. No consulta la base ni
// arma respuestas de error a mano.
//
// En Express 5 no hace falta try/catch: si el service lanza, el error llega solo
// al middleware de manejo de errores.
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { LoginInput, RegisterInput } from './auth.schema';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as RegisterInput;
    const result = await authService.register(data);
    // 201: la request creó un recurso nuevo (el usuario).
    res.status(201).json(result);
  },

  async login(req: Request, res: Response): Promise<void> {
    const data = req.validated.body as LoginInput;
    const result = await authService.login(data);
    // 200 y no 201: iniciar sesión no crea nada en la base.
    res.status(200).json(result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await authService.refresh(req.user!.id_user);
    // 200: no se crea nada, se emite un token nuevo para el mismo usuario.
    res.status(200).json(result);
  },

  async me(req: Request, res: Response): Promise<void> {
    // req.user siempre está: la ruta pasa antes por requireAuth, que corta con
    // 401 si el token falta o no es válido.
    const user = await authService.getProfile(req.user!.id_user);
    res.status(200).json(user);
  },
};
