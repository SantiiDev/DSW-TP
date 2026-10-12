// Seed de DEMOSTRACIÓN: carga ventas de la membresía Pro para que el dashboard de
// administración tenga algo que mostrar en la defensa.
//
// No es parte del modelo de negocio y por eso NO corre dentro de `npm run seed`
// ni de `db:reset`: hay que pedirlo a mano. El dashboard no sabe que estos datos
// son de prueba —los lee de las mismas tablas que un pago real—, así que un pago
// que entre por MercadoPago se suma a estos sin hacer nada.
//
// Cada venta de demo es un usuario nuevo con su suscripción activa y su pago
// aprobado, creados en UNA transacción por usuario. Es la misma regla que sostiene
// subscription.service ("el rol refleja la suscripción vigente"): o queda el
// usuario Pro con su membresía y su pago, o no queda nada.
//
// Cómo se reconocen los datos de demo, para poder borrarlos:
//   - los usuarios tienen email @demo.musicboxd.local;
//   - los pagos tienen id_gateway con prefijo "demo-" (un id real de MercadoPago
//     es un número, así que no pueden chocar).
//
// Uso:
//   npm run seed:demo-sales              carga las ventas (idempotente)
//   npm run seed:demo-sales -- --clean   las borra. Correrlo ANTES del deploy.
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Payment, Plan, Subscription, User } from '../entities';
import { sequelize } from '../shared/db/sequelize';
import { PRO_PLAN_NAME } from '../features/subscription/subscription.service';

/** Dominio de los emails de demo. `.local` no existe en internet: nunca llega un mail. */
const DEMO_EMAIL_DOMAIN = 'demo.musicboxd.local';

/** Prefijo de id_gateway que marca un pago como de demostración. */
const DEMO_GATEWAY_PREFIX = 'demo-';

/** Mismo costo de bcrypt que auth.service y seed-admin-user. */
const SALT_ROUNDS = 10;

/**
 * Hace cuántos días compró cada usuario de demo. Se cuentan desde hoy, y no con
 * fechas fijas, para que la curva caiga siempre en los últimos meses y ninguna
 * venta quede en el futuro.
 */
const PURCHASE_DAYS_AGO = [212, 187, 160, 131, 118, 96, 71, 45, 22, 6];

/** Cuántos días antes de comprar se registró cada usuario de demo. */
const DAYS_REGISTERED_BEFORE_PURCHASE = 12;

/** Resta días a una fecha sin modificar la original. */
function daysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Crea las ventas de demo que falten.
 *
 * Idempotente: un usuario de demo que ya existe se saltea, así que se puede
 * correr las veces que haga falta sin duplicar ventas.
 */
export async function seedDemoSales(): Promise<void> {
  // El monto sale del plan real: si el admin cambia el precio, las ventas de demo
  // nuevas se cobran al precio nuevo, igual que las reales.
  const proPlan = await Plan.findOne({ where: { name: PRO_PLAN_NAME } });
  if (!proPlan) {
    throw new Error(`No existe el plan "${PRO_PLAN_NAME}". Corré antes npm run seed:plans.`);
  }

  let created = 0;

  for (const [index, daysAgo] of PURCHASE_DAYS_AGO.entries()) {
    const username = `demo_comprador_${index + 1}`;
    const email = `${username}@${DEMO_EMAIL_DOMAIN}`;

    if (await User.findOne({ where: { email } })) {
      console.log(`[seed:demo] Ya existe, se omite: ${username}`);
      continue;
    }

    const purchaseDate = daysBefore(new Date(), daysAgo);

    await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          username,
          email,
          // Contraseña al azar que nadie conoce: son cuentas para llenar métricas,
          // no para iniciar sesión.
          password: await bcrypt.hash(randomBytes(24).toString('hex'), SALT_ROUNDS),
          rol: 'PRO',
          registration_date: daysBefore(purchaseDate, DAYS_REGISTERED_BEFORE_PURCHASE),
        },
        { transaction }
      );

      const subscription = await Subscription.create(
        {
          id_user: user.id_user,
          id_plan: proPlan.id_plan,
          subscription_date: purchaseDate,
          // Pago único: la membresía no vence (ver subscription.service).
          end_date: null,
          state: 'active',
        },
        { transaction }
      );

      await Payment.create(
        {
          amount: proPlan.amount,
          payment_date: purchaseDate,
          state: 'approved',
          id_gateway: `${DEMO_GATEWAY_PREFIX}${username}`,
          id_subscription: subscription.id_subscription,
        },
        { transaction }
      );
    });

    created += 1;
    console.log(`[seed:demo] Venta creada: ${username} (${purchaseDate.toLocaleDateString('es-AR')})`);
  }

  console.log(`[seed:demo] Listo: ${created} ventas nuevas.`);
}

/**
 * Borra todo lo que cargó seedDemoSales, y nada más.
 *
 * El orden es el inverso de las claves foráneas: pagos, suscripciones y recién
 * al final los usuarios. Va en una transacción: si algo falla a mitad de camino
 * (por ejemplo, alguien siguió a un usuario de demo y la FK lo impide), no queda
 * la mitad borrada.
 */
export async function cleanDemoSales(): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    const demoUsers = await User.findAll({
      where: { email: { [Op.like]: `%@${DEMO_EMAIL_DOMAIN}` } },
      attributes: ['id_user'],
      transaction,
    });
    const userIds = demoUsers.map((user) => user.id_user);

    const payments = await Payment.destroy({
      where: { id_gateway: { [Op.like]: `${DEMO_GATEWAY_PREFIX}%` } },
      transaction,
    });

    const subscriptions = userIds.length
      ? await Subscription.destroy({ where: { id_user: userIds }, transaction })
      : 0;

    const users = userIds.length
      ? await User.destroy({ where: { id_user: userIds }, transaction })
      : 0;

    console.log(
      `[seed:demo] Borrados: ${payments} pagos, ${subscriptions} suscripciones y ${users} usuarios de demo.`
    );
  });
}

// Permite correrlo solo, con `npm run seed:demo-sales`, y con `-- --clean` para borrar.
if (require.main === module) {
  void (async () => {
    const clean = process.argv.includes('--clean');
    try {
      await sequelize.authenticate();
      console.log('[seed:demo] Conectado a la base de datos.');
      await (clean ? cleanDemoSales() : seedDemoSales());
      await sequelize.close();
    } catch (error) {
      console.error(`[seed:demo] Falló ${clean ? 'la limpieza' : 'la carga'} de las ventas de demo:`);
      console.error(error);
      process.exit(1);
    }
  })();
}
