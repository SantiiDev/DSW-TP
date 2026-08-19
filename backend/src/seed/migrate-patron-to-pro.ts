// Migración puntual: elimina el nivel PATRON del sistema y lo fusiona con PRO.
//
// El modelo de negocio pasó de tres niveles pagos (FREE | PRO | PATRON) a dos
// (FREE | PRO): todo lo que antes era exclusivo de Patron —el aporte de catálogo—
// ahora entra en Pro. El código ya no conoce PATRON, pero una base que se creó
// antes del cambio sí lo tiene guardado, y hay que limpiarla.
//
// Qué hace, en este orden:
//   1. Pasa a PRO todos los usuarios que tuvieran rol PATRON.
//   2. Reapunta al plan Pro las suscripciones que apuntaban al plan Patron.
//   3. Borra el plan Patron.
//
// CUÁNDO CORRERLO: **antes** de levantar el backend con el código nuevo. Al
// arrancar con DB_SYNC=true, Sequelize achica el ENUM de `users.rol` para sacarle
// PATRON, y eso falla (o pisa el valor) si todavía quedan filas con ese rol.
//
//   npm run db:migrate:patron
//
// Es idempotente: sobre una base ya migrada no encuentra nada y no hace nada.
// En una base local descartable se puede usar `npm run db:reset` en su lugar.
import { QueryTypes } from 'sequelize';
import { env } from '../shared/config/env';
import { sequelize } from '../shared/db/sequelize';

// Importa las entidades por su efecto colateral: registra los modelos. Las
// consultas van en SQL crudo justamente porque PATRON ya no existe en el tipado.
import '../entities';

/**
 * Pasa a PRO los usuarios que hayan quedado con rol PATRON.
 * @returns cuántas filas se actualizaron.
 *
 * Se cuenta con un SELECT antes de actualizar en vez de leer las filas afectadas
 * que devuelve el driver: ese dato cambia de forma según el dialecto y acá lo
 * único que se busca es un número para el resumen de consola.
 */
async function movePatronUsersToPro(): Promise<number> {
  // Se compara con CAST(... AS CHAR) porque, si el ENUM ya se achicó, comparar
  // la columna contra un valor que no está en la lista da error en MySQL.
  const [row] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM users WHERE CAST(rol AS CHAR) = 'PATRON'`,
    { type: QueryTypes.SELECT }
  );

  if (row.total === 0) return 0;

  await sequelize.query(`UPDATE users SET rol = 'PRO' WHERE CAST(rol AS CHAR) = 'PATRON'`);
  return row.total;
}

/**
 * Reapunta al plan Pro las suscripciones del plan Patron y borra ese plan.
 * @returns cuántas suscripciones se reapuntaron y si el plan existía.
 */
async function mergePatronPlanIntoPro(): Promise<{ subscriptions: number; planFound: boolean }> {
  const rows = await sequelize.query<{ id_plan: number; name: string }>(
    `SELECT id_plan, name FROM plan WHERE name IN ('Patron', 'Pro')`,
    { type: QueryTypes.SELECT }
  );

  const patronPlan = rows.find((row) => row.name === 'Patron');
  const proPlan = rows.find((row) => row.name === 'Pro');

  if (!patronPlan) return { subscriptions: 0, planFound: false };

  // Sin plan Pro no se puede reapuntar nada: se corta antes de borrar, para no
  // dejar suscripciones colgadas de una clave foránea que ya no existe.
  if (!proPlan) {
    throw new Error(
      'No existe el plan Pro en la base. Correr `npm run seed:plans` antes de esta migración.'
    );
  }

  const [row] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM subscription WHERE id_plan = :patronId`,
    { replacements: { patronId: patronPlan.id_plan }, type: QueryTypes.SELECT }
  );

  if (row.total > 0) {
    await sequelize.query(`UPDATE subscription SET id_plan = :proId WHERE id_plan = :patronId`, {
      replacements: { proId: proPlan.id_plan, patronId: patronPlan.id_plan },
    });
  }

  // Recién ahora se puede borrar el plan: ya no queda ninguna suscripción
  // apuntándole, así que la clave foránea no lo bloquea.
  await sequelize.query(`DELETE FROM plan WHERE id_plan = :patronId`, {
    replacements: { patronId: patronPlan.id_plan },
  });

  return { subscriptions: row.total, planFound: true };
}

async function migrate(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log(`[migrate] Base destino: ${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`);

    const users = await movePatronUsersToPro();
    console.log(
      users > 0
        ? `[migrate] Usuarios PATRON pasados a PRO: ${users}.`
        : '[migrate] No había usuarios con rol PATRON.'
    );

    const { subscriptions, planFound } = await mergePatronPlanIntoPro();
    if (planFound) {
      console.log(`[migrate] Suscripciones reapuntadas al plan Pro: ${subscriptions}.`);
      console.log('[migrate] Plan Patron eliminado.');
    } else {
      console.log('[migrate] No existía el plan Patron.');
    }

    await sequelize.close();
    console.log('[migrate] Listo. Ya se puede levantar el backend con `npm run dev`.');
  } catch (error) {
    console.error('[migrate] Falló la migración:');
    console.error(error);
    process.exit(1);
  }
}

void migrate();
