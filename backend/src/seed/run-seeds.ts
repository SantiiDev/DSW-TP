// Corre todos los seeds del proyecto, en orden.
//
// Es el único lugar donde se define ese orden: a medida que se sumen seeds nuevos
// (el catálogo de la Fase 2, el usuario administrador inicial), se agregan acá y
// quedan incluidos automáticamente en `npm run seed` y en `npm run db:reset`.
//
// Todos los seeds son idempotentes, así que este script se puede correr sobre una
// base ya cargada sin duplicar nada.
//
// Uso:  npm run seed
import { sequelize } from '../shared/db/sequelize';
import { seedAdminUser } from './seed-admin-user';
import { seedCatalog } from './seed-catalog';
import { seedPlans } from './seed-plans';

// Ejecuta la secuencia completa de seeds. No abre ni cierra la conexión.
//
// Ninguno de estos seeds sale a internet: el catálogo se lee de los archivos ya
// descargados en `seed/data/`. Bajarlos de Deezer es tarea aparte de
// `npm run seed:fetch`, que se corre a mano y solo al ampliar el catálogo.
export async function runAllSeeds(): Promise<void> {
  await seedPlans();
  await seedCatalog();
  await seedAdminUser();
}

if (require.main === module) {
  void (async () => {
    try {
      await sequelize.authenticate();
      console.log('[seed] Conectado a la base de datos.');
      await runAllSeeds();
      console.log('[seed] Todos los seeds ejecutados.');
      await sequelize.close();
    } catch (error) {
      console.error('[seed] Falló la ejecución de los seeds:');
      console.error(error);
      process.exit(1);
    }
  })();
}
