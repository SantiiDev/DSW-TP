// Acceso a datos de la feature follow: consultas a la tabla follows y a users
// para el seguimiento entre usuarios. Es la única capa que habla con Sequelize.
//
// Todas las consultas van contra la tabla intermedia directamente y no por el
// belongsToMany 'following' / 'followers' declarado en entities/index.ts. El
// motivo está explicado ahí: User tiene un defaultScope que excluye la
// contraseña, y ese exclude combinado con un self-join con alias da consultas
// raras en Sequelize 6. Además, para contar seguidores no hace falta traer los
// usuarios enteros.
import { literal, Op } from 'sequelize';
import { Follow, User } from '../../entities';

/**
 * Usuario tal como lo devuelve la consulta de sugerencias: la fila de users más
 * las dos cuentas que se calculan con subconsultas.
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

const FOLLOWERS_COUNT = literal(
  '(SELECT COUNT(*) FROM `follows` WHERE `follows`.`id_followed` = `User`.`id_user`)'
);

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

  /** Cuántos siguen a este usuario. */
  countFollowers: (id_user: number) => Follow.count({ where: { id_followed: id_user } }),

  /** A cuántos sigue este usuario. */
  countFollowing: (id_user: number) => Follow.count({ where: { id_follower: id_user } }),

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
      // Los atributos se enumeran a mano en vez de dejar que los ponga el
      // defaultScope: así la consulta no depende de ese scope y no hay forma de
      // que se filtre a la respuesta un campo que no queremos mostrar.
      attributes: [
        'id_user',
        'username',
        'url_avatar',
        'rol',
        [REVIEWS_COUNT, 'reviews_count'],
        [FOLLOWERS_COUNT, 'followers_count'],
      ],
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
