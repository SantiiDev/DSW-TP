// Reinicia la base de datos local desde cero: borra todas las tablas, las vuelve a
// crear a partir de las entidades y corre todos los seeds.
//
// Para qué sirve: `sequelize.sync({ alter: true })` es bueno agregando columnas,
// pero flojo renombrando o eliminando, y si se corre muchas veces puede dejar
// índices duplicados. Cuando la base local queda rara después de varios cambios de
// modelo, en vez de pelearla conviene rehacerla: como todos los datos vienen de los
// seeds, no se pierde nada.
//
// Uso:  npm run db:reset
//
// OJO: BORRA TODOS LOS DATOS de la base indicada en el .env. Está pensado
// exclusivamente para las bases locales de desarrollo.
import { QueryTypes } from 'sequelize';
import { env } from '../shared/config/env';
import { sequelize } from '../shared/db/sequelize';
import { runAllSeeds } from './run-seeds';

// Importa las entidades por su efecto colateral: registra los modelos y sus
// asociaciones, que es lo que sync() necesita para recrear el esquema.
import '../entities';

// Borra todas las tablas del esquema actual, incluidas las que ya no correspondan a
// ninguna entidad (por ejemplo, si alguien renombró un modelo y quedó la tabla vieja).
async function dropAllTables(): Promise<void> {
  const rows = await sequelize.query<{ TABLE_NAME: string }>(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = :schema AND TABLE_TYPE = 'BASE TABLE'`,
    { replacements: { schema: env.db.name }, type: QueryTypes.SELECT }
  );

  if (rows.length === 0) {
    console.log('[reset] La base ya estaba vacía.');
    return;
  }

  // Se desactivan las verificaciones de clave foránea para poder borrar sin
  // preocuparse por el orden de las dependencias entre tablas.
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const row of rows) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${row.TABLE_NAME}\``);
    }
  } finally {
    // En un finally para que las verificaciones queden activadas incluso si
    // alguno de los DROP falla.
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  console.log(`[reset] ${rows.length} tablas eliminadas.`);
}

async function resetDatabase(): Promise<void> {
  // Barrera de seguridad: este script nunca debe poder correrse contra la base
  // de producción, donde sí hay datos reales que no se regeneran con un seed.
  if (env.isProduction) {
    console.error('[reset] Bloqueado: NODE_ENV=production. Este script solo corre en desarrollo.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();

    // Se muestra el destino antes de borrar, para que quede claro sobre qué base
    // se está trabajando (es fácil tener varios MySQL locales en puertos distintos).
    console.log(`[reset] Base destino: ${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`);
    console.log('[reset] Se van a borrar TODAS sus tablas y datos.');

    await dropAllTables();

    await sequelize.sync();
    console.log('[reset] Esquema recreado a partir de las entidades.');

    await runAllSeeds();
    console.log('[reset] Seeds ejecutados.');

    await sequelize.close();
    console.log('[reset] Base lista para usar.');
  } catch (error) {
    console.error('[reset] Falló el reinicio de la base:');
    console.error(error);
    process.exit(1);
  }
}

void resetDatabase();
