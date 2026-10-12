// Punto de entrada del backend.
// Verifica la conexión a la base de datos ANTES de aceptar requests: si la base
// no responde, es preferible que el proceso falle acá con un mensaje claro y no
// que la API quede levantada devolviendo errores 500 en cada endpoint.
import { app } from './app';
import { env } from './shared/config/env';
import { sequelize } from './shared/db/sequelize';

// Importa las entidades por su efecto colateral: registra los modelos en la
// instancia de Sequelize y define todas las asociaciones entre ellos.
import './entities';

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log(`[db] Conectado a MySQL en ${env.db.host}:${env.db.port}/${env.db.name}`);

    // sync() crea o ajusta las tablas a partir de las entidades. Se controla por
    // la variable DB_SYNC porque en producción el esquema no se toca al arrancar.
    if (env.db.sync) {
      await sequelize.sync({ alter: true });
      console.log('[db] Esquema sincronizado a partir de las entidades (DB_SYNC=true)');
    }

    app.listen(env.port, () => {
      console.log(`[api] Escuchando en http://localhost:${env.port}/api`);
      console.log(`[api] Health check: http://localhost:${env.port}/api/health`);
      console.log(`[api] Entorno: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('[api] No se pudo iniciar el servidor:');
    console.error(error);
    process.exit(1);
  }
}

void bootstrap();
