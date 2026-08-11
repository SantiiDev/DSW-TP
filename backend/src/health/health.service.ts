// Service del health check: contiene la lógica, sin saber nada de HTTP.
import { sequelize } from '../shared/db/sequelize';

type HealthStatus = {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  uptimeSeconds: number;
  timestamp: string;
};

export const healthService = {
  // Devuelve el estado de la API y de su conexión a MySQL.
  async getStatus(): Promise<HealthStatus> {
    let database: 'up' | 'down' = 'up';

    try {
      await sequelize.authenticate();
    } catch {
      // El health check no debe romper: si la base no responde, lo informa.
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  },
};
