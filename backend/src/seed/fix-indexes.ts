// Limpia los índices duplicados que dejó sequelize.sync({ alter: true }).
//
// Uso:  npm run db:fix-indexes
//
// Por qué existe:
// Hasta ahora las columnas únicas se declaraban con `unique: true` dentro de la
// definición de la columna. Eso genera en MySQL un índice SIN NOMBRE, y al
// arrancar de nuevo Sequelize no lo reconoce como propio, así que crea otro
// (username_2, username_3, ...). A razón de uno por reinicio, la tabla llega a
// los 64 índices que permite MySQL y el servidor deja de arrancar con
// ER_TOO_MANY_KEYS.
//
// Las entidades ya se corrigieron para declarar esos índices con nombre, así que
// el problema no se repite. Pero las bases que ya venían acumulando duplicados
// hay que limpiarlas una vez, y de eso se encarga este script.
//
// Es seguro: solo toca índices, nunca datos, y deja siempre uno por columna.
import { QueryTypes } from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

type IndexRow = {
  Key_name: string;
  Column_name: string;
  Non_unique: number;
};

/**
 * Índices que se conservan por tabla: los nombres canónicos que ahora declaran
 * las entidades. Cualquier otro índice único sobre la misma columna es un
 * duplicado que dejó una corrida vieja de sync.
 */
const CANONICAL_INDEXES: Record<string, Record<string, string>> = {
  users: { username: 'users_username_unique', email: 'users_email_unique' },
  genres: { name: 'genres_name_unique' },
  plan: { name: 'plan_name_unique' },
  payments: { id_gateway: 'payments_id_gateway_unique' },
};

/**
 * Limpia los duplicados de una tabla.
 * @param table nombre de la tabla.
 * @returns cuántos índices se borraron.
 */
async function cleanTable(table: string, columns: Record<string, string>): Promise<number> {
  const rows = await sequelize.query<IndexRow>(`SHOW INDEX FROM \`${table}\``, {
    type: QueryTypes.SELECT,
  });

  // Un índice puede ocupar varias filas (una por columna). Acá solo interesan los
  // de una columna sola, que son los que genera `unique: true`.
  const indexColumns = new Map<string, string[]>();
  const isUnique = new Map<string, boolean>();

  for (const row of rows) {
    const columnsOfIndex = indexColumns.get(row.Key_name) ?? [];
    columnsOfIndex.push(row.Column_name);
    indexColumns.set(row.Key_name, columnsOfIndex);
    isUnique.set(row.Key_name, row.Non_unique === 0);
  }

  let dropped = 0;

  for (const [column, canonicalName] of Object.entries(columns)) {
    // Todos los índices únicos que aplican solo a esta columna...
    const candidates = [...indexColumns.entries()]
      .filter(([name, cols]) => cols.length === 1 && cols[0] === column && isUnique.get(name))
      .map(([name]) => name)
      // ...menos PRIMARY, que nunca se toca.
      .filter((name) => name !== 'PRIMARY');

    // Se conserva el canónico si ya existe; si no, el primero de la lista, para
    // no dejar la columna sin restricción de unicidad en ningún momento.
    const keep = candidates.includes(canonicalName) ? canonicalName : candidates[0];

    for (const name of candidates) {
      if (name === keep) continue;
      await sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${name}\``);
      dropped++;
    }

    if (keep) {
      console.log(`[fix-indexes] ${table}.${column}: se conservó "${keep}"`);
    }
  }

  return dropped;
}

async function fixIndexes(): Promise<void> {
  let total = 0;

  for (const [table, columns] of Object.entries(CANONICAL_INDEXES)) {
    const dropped = await cleanTable(table, columns);
    total += dropped;
    console.log(`[fix-indexes] ${table}: ${dropped} índices duplicados eliminados.`);
  }

  console.log(
    total === 0
      ? '[fix-indexes] No había duplicados: la base ya estaba limpia.'
      : `[fix-indexes] Listo. Se eliminaron ${total} índices duplicados en total.`
  );
}

void (async () => {
  try {
    await sequelize.authenticate();
    console.log('[fix-indexes] Conectado a la base de datos.');
    await fixIndexes();
    await sequelize.close();
  } catch (error) {
    console.error('[fix-indexes] Falló la limpieza de índices:');
    console.error(error);
    process.exit(1);
  }
})();
