// Acceso a datos de la feature follow: consultas a la tabla follows y a users
// para el seguimiento entre usuarios. Es la única capa que habla con Sequelize.
//
// Todas las consultas van contra la tabla intermedia directamente y no por el
// belongsToMany 'following' / 'followers' declarado en entities/index.ts. El
// motivo está explicado ahí: User tiene un defaultScope que excluye la
// contraseña, y ese exclude combinado con un self-join con alias da consultas
// raras en Sequelize 6. Además, para contar seguidores no hace falta traer los
// usuarios enteros.
import { FindAttributeOptions, literal, Op } from 'sequelize';
import { Follow, User } from '../../entities';
import { escapeLike, startsWithFirst } from '../../shared/db/like';
import { sequelize } from '../../shared/db/sequelize';

/**
 * Usuario tal como lo devuelven las consultas de sugerencias, búsqueda y listas
 * de seguidores: la fila de users más las dos cuentas que se calculan con
 * subconsultas.
 *
 * Los conteos no están declarados en user.entity.ts porque no son columnas de la
 * tabla: se agregan acá, que es la capa que sabe cómo está armada la consulta.
 * Es el mismo criterio que GenreWithAlbums en genre.repository.ts.
 */
export type SuggestedUserRow = User & {
  reviews_count: number;
  followers_count: number;
};

/** Filtros del panel "Gente para seguir". */
export type SuggestionFilters = {
  limit: number;
  /** Ids que no tienen que aparecer: el propio usuario y los que ya sigue. */
  excludeIds: number[];
};

// Cuántas reseñas publicadas tiene cada usuario, y cuántos lo siguen.
//
// Van como subconsultas correlacionadas y no como includes por dos motivos: dos
// hasMany en la misma consulta se multiplican entre sí si no llevan
// separate: true, y con separate: true no se pueden usar para ordenar. Es la
// misma técnica que usa album.repository.buildOrder para "los más reseñados".
//
// Solo cuenta las reseñas 'published': una oculta por moderación no es un mérito
// para recomendar a alguien.
const REVIEWS_COUNT = literal(
  '(SELECT COUNT(*) FROM `review` WHERE `review`.`id_user` = `User`.`id_user` ' +
    "AND `review`.`state` = 'published')"
);

// Solo cuenta seguidores con la cuenta activa: es el mismo número que se ve al
// abrir la lista, que tampoco muestra a los suspendidos.
const FOLLOWERS_COUNT = literal(
  '(SELECT COUNT(*) FROM `follows` INNER JOIN `users` AS `follower` ' +
    'ON `follower`.`id_user` = `follows`.`id_follower` ' +
    "WHERE `follows`.`id_followed` = `User`.`id_user` AND `follower`.`state` = 'active')"
);

/**
 * Columnas de la tarjeta de un usuario. Se enumeran a mano en vez de dejar que
 * las ponga el defaultScope: así la consulta no depende de ese scope y no hay
 * forma de que se filtre a la respuesta un campo que no queremos mostrar (el
 * email, por ejemplo).
 */
const USER_CARD_ATTRIBUTES: FindAttributeOptions = [
  'id_user',
  'username',
  'url_avatar',
  'rol',
  [REVIEWS_COUNT, 'reviews_count'],
  [FOLLOWERS_COUNT, 'followers_count'],
];

/** Ids de las cuentas activas, para no contar ni listar a los suspendidos. */
const ACTIVE_USER_IDS = "(SELECT `id_user` FROM `users` WHERE `state` = 'active')";

/** Paginado de las listas de seguidores y seguidos. */
export type FollowListFilters = {
  id_user: number;
  limit: number;
  offset: number;
};

/**
 * Lista de usuarios relacionados por la tabla follows con uno dado.
 *
 * Es una sola consulta sobre users, y no "traer las filas de follows y después los
 * usuarios", para que el paginado cuente solo cuentas activas: filtrando después,
 * una tanda de 20 podía llegar con 17 y el "Cargar más" se cortaba antes de tiempo.
 *
 * @param filters usuario, tope y desplazamiento.
 * @param side 'followers' trae a quienes lo siguen; 'following', a quienes sigue.
 */
async function findFollowList(
  { id_user, limit, offset }: FollowListFilters,
  side: 'followers' | 'following'
): Promise<SuggestedUserRow[]> {
  // Qué columna de follows se busca y cuál se devuelve depende del lado. El id
  // viene validado como número por Zod, y además se escapa: nunca se concatena
  // crudo en SQL.
  const [matchColumn, resultColumn] =
    side === 'followers' ? ['id_followed', 'id_follower'] : ['id_follower', 'id_followed'];
  const id = sequelize.escape(id_user);

  const relatedIds = literal(
    `(SELECT \`${resultColumn}\` FROM \`follows\` WHERE \`${matchColumn}\` = ${id})`
  );
  // Del seguimiento más reciente al más viejo: lo último que pasó, primero.
  const followDate = literal(
    `(SELECT \`follow_date\` FROM \`follows\` WHERE \`${matchColumn}\` = ${id} ` +
      `AND \`${resultColumn}\` = \`User\`.\`id_user\`)`
  );

  const users = await User.findAll({
    attributes: USER_CARD_ATTRIBUTES,
    where: { state: 'active', id_user: { [Op.in]: relatedIds } },
    order: [
      [followDate, 'DESC'],
      ['id_user', 'ASC'],
    ],
    limit,
    offset,
  });

  return users as SuggestedUserRow[];
}

export const followRepository = {
  /** El seguimiento puntual, o null si esa persona no lo sigue. */
  findOne: (id_follower: number, id_followed: number) =>
    Follow.findOne({ where: { id_follower, id_followed } }),

  create: (id_follower: number, id_followed: number) =>
    Follow.create({ id_follower, id_followed }),

  delete: (follow: Follow) => follow.destroy(),

  /**
   * Los ids de la gente que sigue un usuario.
   *
   * Es la consulta que alimenta el feed de amigos: devuelve solo la columna, sin
   * tocar la tabla users, porque lo único que hace falta después es un
   * `WHERE id_user IN (...)` sobre las reseñas.
   *
   * @param id_follower usuario que sigue.
   */
  findFollowedIds: async (id_follower: number): Promise<number[]> => {
    const rows = await Follow.findAll({
      attributes: ['id_followed'],
      where: { id_follower },
    });

    return rows.map((row) => row.id_followed);
  },

  /**
   * Cuántos siguen a este usuario. Solo cuentas activas, para que el número de la
   * cabecera coincida con lo que se ve al abrir la lista.
   */
  countFollowers: (id_user: number) =>
    Follow.count({
      where: { id_followed: id_user, id_follower: { [Op.in]: literal(ACTIVE_USER_IDS) } },
    }),

  /** A cuántos sigue este usuario. Mismo criterio: solo cuentas activas. */
  countFollowing: (id_user: number) =>
    Follow.count({
      where: { id_follower: id_user, id_followed: { [Op.in]: literal(ACTIVE_USER_IDS) } },
    }),

  /** Quiénes siguen a un usuario, paginado. */
  findFollowers: (filters: FollowListFilters) => findFollowList(filters, 'followers'),

  /** A quiénes sigue un usuario, paginado. */
  findFollowing: (filters: FollowListFilters) => findFollowList(filters, 'following'),

  /**
   * Usuarios cuyo nombre contiene el texto buscado.
   *
   * Primero los que EMPIEZAN con lo buscado: quien escribe "gar" casi seguro busca
   * a "garcia_rock" antes que a "edgar". Después, los que más reseñaron.
   *
   * @param q texto a buscar, ya recortado.
   * @param limit cuántos traer.
   */
  searchByUsername: async (q: string, limit: number): Promise<SuggestedUserRow[]> => {
    const users = await User.findAll({
      attributes: USER_CARD_ATTRIBUTES,
      where: { state: 'active', username: { [Op.like]: `%${escapeLike(q)}%` } },
      order: [
        startsWithFirst('`User`.`username`', q),
        [REVIEWS_COUNT, 'DESC'],
        ['id_user', 'ASC'],
      ],
      limit,
    });

    return users as SuggestedUserRow[];
  },

  /**
   * El usuario al que se quiere seguir. Se consulta users desde esta feature
   * igual que review.repository consulta Album y Song: es una lectura, no una
   * escritura sobre la feature de otro.
   */
  findUserById: (id_user: number) => User.findByPk(id_user),

  /**
   * Los usuarios que se recomienda seguir, del que más reseñas publicó al que
   * menos.
   *
   * El desempate por id_user no es un detalle: con una base recién sembrada todos
   * empatan en cero y, sin él, MySQL devolvería un orden arbitrario y el panel
   * cambiaría de contenido en cada request sin ningún motivo.
   *
   * @param filters cuántos traer y a quiénes excluir.
   */
  findSuggestions: async ({ limit, excludeIds }: SuggestionFilters) => {
    const users = await User.findAll({
      attributes: USER_CARD_ATTRIBUTES,
      where: {
        // Una cuenta suspendida no se puede seguir: su perfil no muestra nada.
        state: 'active',
        ...(excludeIds.length > 0 ? { id_user: { [Op.notIn]: excludeIds } } : {}),
      },
      order: [
        [REVIEWS_COUNT, 'DESC'],
        ['id_user', 'ASC'],
      ],
      limit,
    });

    return users as SuggestedUserRow[];
  },
};
