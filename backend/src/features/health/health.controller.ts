// Controller del endpoint de health check.
// Sirve para verificar de un vistazo que la API responde y que la conexión a la
// base de datos está viva. Es también el ejemplo mínimo del patrón de capas:
// el controller solo traduce entre HTTP y el service, no tiene lógica propia.
import { Request, Response } from 'express';
import { healthService } from './health.service';

export const healthController = {
  async check(_req: Request, res: Response): Promise<void> {
    const status = await healthService.getStatus();
    res.status(200).json(status);
  },
};
