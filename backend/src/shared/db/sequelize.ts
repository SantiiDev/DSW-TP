// Instancia única de Sequelize (conexión a MySQL) usada por todas las entidades.
// Se exporta desde acá para que cada entidad la importe al hacer su Model.init().
import { Sequelize } from 'sequelize';
import { env } from '../config/env';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.db.logging ? console.log : false,

  // Opciones por defecto para TODAS las entidades del proyecto:
  define: {
    // Usar el nombre de tabla tal cual lo declaramos (no pluralizar automáticamente),
    // para que coincida con el pasaje a tablas del DER.
    freezeTableName: true,
    // Las fechas propias del modelo (registration_date, review_date, etc.) ya están
    // en el DER, así que no queremos las columnas createdAt/updatedAt de Sequelize.
    timestamps: false,
  },

  // El servicio cloud (Aiven / Clever Cloud) exige conexión cifrada.
  // En MySQL local DB_SSL=false y este bloque queda vacío.
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          rejectUnauthorized: true,
          ca: env.db.sslCa,
        },
      }
    : {},

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
