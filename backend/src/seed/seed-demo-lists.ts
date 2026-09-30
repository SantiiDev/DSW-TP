// Seed de DEMOSTRACIÓN: carga listas personalizadas para ver cómo queda la
// sección de listas (/lists) con contenido, sin tener que armarlas a mano.
//
// Igual que seed-demo-sales, no es parte del modelo de negocio y por eso NO corre
// dentro de `npm run seed` ni de `db:reset`: hay que pedirlo a mano.
//
// Crea unos pocos usuarios Pro de demo (armar listas es un beneficio Pro) y a
// cada uno le reparte listas de álbumes y de canciones con ítems del catálogo
// real. Después los usuarios se dan "me gusta" entre sí, para que las secciones
// de listas populares y en tendencia también tengan qué ordenar.
//
// Cómo se reconocen los datos de demo, para poder borrarlos: los usuarios tienen
// email @lists.demo.musicboxd.local. Es otro dominio que el de seed-demo-sales a
// propósito: el --clean de aquel borra sus usuarios por dominio y no tiene que
// llevarse puestas estas listas (ni fallar por ellas).
//
// Uso:
//   npm run seed:demo-lists              carga las listas (idempotente)
//   npm run seed:demo-lists -- --clean   las borra. Correrlo ANTES del deploy.
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Album, List, ListAlbum, ListLike, ListSong, Song, User } from '../entities';
import { sequelize } from '../shared/db/sequelize';
import type { ListType } from '../shared/types/enums';

/** Dominio de los emails de demo. `.local` no existe en internet: nunca llega un mail. */
const DEMO_EMAIL_DOMAIN = 'lists.demo.musicboxd.local';

/** Mismo costo de bcrypt que auth.service y seed-admin-user. */
const SALT_ROUNDS = 10;

/** Usuarios dueños de las listas. */
const DEMO_USERNAMES = [
  'demo_melomana',
  'demo_vinilero',
  'demo_rockero',
  'demo_indie_kid',
  'demo_jazzero',
  'demo_djnocturno',
];

type DemoList = { name: string; description: string | null; type: ListType };

/** Las listas a crear. Se reparten entre los usuarios de arriba, en orden. */
const DEMO_LISTS: DemoList[] = [
  { name: 'Discos para un domingo lluvioso', description: 'Para escuchar con un café y sin apuro.', type: 'album' },
  { name: 'Mis 10 álbumes favoritos de todos los tiempos', description: 'Una lista que cambia cada semana, pero estos siempre vuelven.', type: 'album' },
  { name: 'Rock nacional imprescindible', description: 'Lo que no puede faltar en ninguna discoteca argentina.', type: 'album' },
  { name: 'Canciones para manejar de noche', description: 'Ruta vacía, ventanilla baja.', type: 'song' },
  { name: 'Álbumes que escuché de principio a fin', description: null, type: 'album' },
  { name: 'Joyas ocultas', description: 'Discos que casi nadie nombra y merecen mucho más.', type: 'album' },
  { name: 'Para entrenar', description: 'Tempo alto, cero baladas.', type: 'song' },
  { name: 'Clásicos de los 70', description: 'La década que lo cambió todo.', type: 'album' },
  { name: 'Portadas icónicas', description: 'Discos que reconocés antes de escucharlos.', type: 'album' },
  { name: 'Estribillos que no se me van de la cabeza', description: null, type: 'song' },
  { name: 'Primeros discos que me volaron la cabeza', description: 'Los que me hicieron fanático de la música.', type: 'album' },
  { name: 'Pendientes por escuchar', description: 'Me los recomendaron y todavía no les di play.', type: 'album' },
  { name: 'Temas para una cena con amigos', description: 'Música de fondo que igual da ganas de charlar sobre ella.', type: 'song' },
  { name: 'Discos perfectos, sin un tema de relleno', description: null, type: 'album' },
  { name: 'Lo mejor de los 90', description: 'Grunge, brit pop y todo lo del medio.', type: 'album' },
  { name: 'Para concentrarse', description: 'Ideal para estudiar o trabajar.', type: 'song' },
  { name: 'Álbumes debut que marcaron época', description: 'Arrancar así es para pocos.', type: 'album' },
  { name: 'Mi top del año', description: 'Lo que más escuché en los últimos meses.', type: 'album' },
  { name: 'Himnos de estadio', description: 'Para cantar a los gritos con miles de personas.', type: 'song' },
  { name: 'Discos para escuchar con auriculares', description: 'Cada detalle de la producción importa.', type: 'album' },
  { name: 'Colección de vinilos', description: 'Los que tengo en físico, en orden de llegada.', type: 'album' },
  { name: 'Canciones tristes que me encantan', description: null, type: 'song' },
  { name: 'Obras maestras subestimadas', description: 'La crítica no les hizo justicia.', type: 'album' },
  { name: 'Para arrancar el día', description: 'Mejor que el café.', type: 'song' },
  { name: 'Discografía esencial para principiantes', description: 'Por dónde empezar si recién llegás.', type: 'album' },
  { name: 'Álbumes conceptuales', description: 'Discos que cuentan una historia completa.', type: 'album' },
  { name: 'Mis guilty pleasures', description: 'No me juzguen.', type: 'song' },
  { name: 'Lo que suena en casa los viernes', description: null, type: 'album' },
  { name: 'Discos de viaje', description: 'Uno por cada ruta que hice.', type: 'album' },
  { name: 'Canciones de siempre', description: 'Las que vuelven una y otra vez a mi playlist.', type: 'song' },
];

/** Cantidad mínima y máxima de ítems por lista. */
const MIN_ITEMS = 4;
const MAX_ITEMS = 12;

/** Resta días a una fecha sin modificar la original. */
function daysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/** Entero al azar entre min y max, ambos incluidos. */
function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Devuelve `count` elementos distintos de `items`, en orden al azar. */
function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * Crea los usuarios de demo y sus listas.
 *
 * Idempotente a nivel de conjunto: si ya existen usuarios de demo de listas, se
 * asume que el seed ya corrió y no se hace nada (para recargarlas, primero
 * --clean). Todo va en una sola transacción: o quedan todas las listas, o nada.
 */
export async function seedDemoLists(): Promise<void> {
  const existing = await User.count({ where: { email: { [Op.like]: `%@${DEMO_EMAIL_DOMAIN}` } } });
  if (existing > 0) {
    console.log('[seed:demo-lists] Las listas de demo ya existen. Para recargarlas, corré antes --clean.');
    return;
  }

  // Solo contenido aprobado: es el único que se ve en el catálogo público.
  const albumIds = (
    await Album.findAll({ where: { state: 'approved' }, attributes: ['id_album'] })
  ).map((album) => album.id_album);
  const songIds = (
    await Song.findAll({ where: { state: 'approved' }, attributes: ['id_song'] })
  ).map((song) => song.id_song);

  if (albumIds.length < MAX_ITEMS || songIds.length < MAX_ITEMS) {
    throw new Error('El catálogo tiene muy pocos álbumes o canciones. Corré antes npm run seed.');
  }

  await sequelize.transaction(async (transaction) => {
    const now = new Date();

    // Contraseña al azar que nadie conoce: son cuentas para llenar la sección,
    // no para iniciar sesión.
    const users = [];
    for (const username of DEMO_USERNAMES) {
      users.push(
        await User.create(
          {
            username,
            email: `${username}@${DEMO_EMAIL_DOMAIN}`,
            password: await bcrypt.hash(randomBytes(24).toString('hex'), SALT_ROUNDS),
            rol: 'PRO',
            registration_date: daysBefore(now, randomInt(100, 300)),
          },
          { transaction }
        )
      );
    }

    for (const [index, demo] of DEMO_LISTS.entries()) {
      const owner = users[index % users.length];

      // Fechas repartidas en los últimos 90 días, para que el orden por
      // "recientes" y las tendencias no queden todas empatadas.
      const creationDate = daysBefore(now, randomInt(0, 90));

      const list = await List.create(
        {
          name: demo.name,
          description: demo.description,
          type: demo.type,
          creation_date: creationDate,
          id_user: owner.id_user,
        },
        { transaction }
      );

      const itemCount = randomInt(MIN_ITEMS, MAX_ITEMS);
      if (demo.type === 'album') {
        await ListAlbum.bulkCreate(
          pickRandom(albumIds, itemCount).map((id_album, position) => ({
            id_list: list.id_list,
            id_album,
            position: position + 1,
            added_date: creationDate,
          })),
          { transaction }
        );
      } else {
        await ListSong.bulkCreate(
          pickRandom(songIds, itemCount).map((id_song, position) => ({
            id_list: list.id_list,
            id_song,
            position: position + 1,
            added_date: creationDate,
          })),
          { transaction }
        );
      }

      // "Me gusta" de otros usuarios de demo (nunca del dueño), en cantidades
      // distintas para que el ranking de populares tenga un orden claro.
      const likers = pickRandom(
        users.filter((user) => user.id_user !== owner.id_user),
        randomInt(0, users.length - 1)
      );
      await ListLike.bulkCreate(
        likers.map((user) => ({
          id_list: list.id_list,
          id_user: user.id_user,
          liked_date: daysBefore(now, randomInt(0, 14)),
        })),
        { transaction }
      );
    }
  });

  console.log(
    `[seed:demo-lists] Listo: ${DEMO_LISTS.length} listas de ${DEMO_USERNAMES.length} usuarios de demo.`
  );
}

/**
 * Borra todo lo que cargó seedDemoLists, y nada más.
 *
 * Se borra en el orden inverso de las claves foráneas (me gusta, ítems, listas y
 * al final los usuarios) en vez de confiar en los CASCADE, y en una transacción
 * para no dejar la mitad borrada si algo falla.
 */
export async function cleanDemoLists(): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    const demoUsers = await User.findAll({
      where: { email: { [Op.like]: `%@${DEMO_EMAIL_DOMAIN}` } },
      attributes: ['id_user'],
      transaction,
    });
    const userIds = demoUsers.map((user) => user.id_user);
    if (userIds.length === 0) {
      console.log('[seed:demo-lists] No hay listas de demo para borrar.');
      return;
    }

    const listIds = (
      await List.findAll({ where: { id_user: userIds }, attributes: ['id_list'], transaction })
    ).map((list) => list.id_list);

    // Los me gusta de los usuarios de demo a listas ajenas también se van.
    const likes = await ListLike.destroy({
      where: { [Op.or]: [{ id_list: listIds }, { id_user: userIds }] },
      transaction,
    });
    await ListAlbum.destroy({ where: { id_list: listIds }, transaction });
    await ListSong.destroy({ where: { id_list: listIds }, transaction });
    const lists = await List.destroy({ where: { id_list: listIds }, transaction });
    const users = await User.destroy({ where: { id_user: userIds }, transaction });

    console.log(
      `[seed:demo-lists] Borrados: ${lists} listas, ${likes} me gusta y ${users} usuarios de demo.`
    );
  });
}

// Permite correrlo solo, con `npm run seed:demo-lists`, y con `-- --clean` para borrar.
if (require.main === module) {
  void (async () => {
    const clean = process.argv.includes('--clean');
    try {
      await sequelize.authenticate();
      console.log('[seed:demo-lists] Conectado a la base de datos.');
      await (clean ? cleanDemoLists() : seedDemoLists());
      await sequelize.close();
    } catch (error) {
      console.error(`[seed:demo-lists] Falló ${clean ? 'la limpieza' : 'la carga'} de las listas de demo:`);
      console.error(error);
      process.exit(1);
    }
  })();
}
