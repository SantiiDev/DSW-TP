// Seed mínimo: carga los tres planes de membresía del modelo de negocio.
//
// Es idempotente: se puede correr las veces que haga falta sin duplicar registros.
// Sirve además para verificar de punta a punta que la conexión, las entidades y el esquema están bien (si esto corre, el modelo funciona).
//
// El seed grande del catálogo (géneros, artistas, álbumes y canciones tomados de un servicio de metadata musical) es la Fase 2 y vive en este mismo directorio.
//
// Uso:  npm run seed:plans
import { sequelize } from '../shared/db/sequelize';
import { Plan } from '../entities';

const PLANS = [
  {
    name: 'Free',
    amount: 0,
    description: 'Reseñá y calificá álbumes y canciones. Incluye anuncios.',
  },
  {
    name: 'Pro',
    amount: 3500,
    description: 'Sin anuncios, estadísticas avanzadas y personalización de perfil.',
  },
  {
    name: 'Patron',
    amount: 7000,
    description:
      'Todo lo de Pro, más la posibilidad de aportar artistas, álbumes y canciones al catálogo.',
  },
];

async function seedPlans(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[seed] Conectado a la base de datos.');

    for (const plan of PLANS) {
      // findOrCreate evita duplicar si el seed ya se corrió antes.
      const [record, created] = await Plan.findOrCreate({
        where: { name: plan.name },
        defaults: plan,
      });
      console.log(
        created
          ? `[seed] Plan creado: ${record.name} ($${record.amount})`
          : `[seed] Plan ya existente, se omite: ${record.name}`
      );
    }

    console.log('[seed] Listo.');
    await sequelize.close();
  } catch (error) {
    console.error('[seed] Falló la carga de planes:');
    console.error(error);
    process.exit(1);
  }
}

void seedPlans();
