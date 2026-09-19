// Acceso a datos de la feature list: consultas a las tablas lists, list_albums y
// list_likes para el CRUD de listas personalizadas. Es la única capa que habla
// con Sequelize.
import { IncludeOptions, Op, Order, literal } from 'sequelize';
import { Album, Artist, Genre, List, ListAlbum, ListLike, User } from '../../entities';
import { escapeLike } from '../../shared/db/like';
import { ContentState } from '../../shared/types/enums';
import { ListSort } from './list.schema';

/** Autor de la lista, reducido a lo que se muestra en su tarjeta. */
export type ListUser = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

/** Artista del álbum de una lista, para poder nombrarlo debajo del título. */
export type ListAlbumArtist = {
  id_artist: number;
  name: string;
};

/** Álbum tal como viaja dentro de una lista. */
export type ListAlbumRef = {
  id_album: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist?: ListAlbumArtist | null;
};

/** Fila de la tabla intermedia, con el álbum ya resuelto. */
export type ListItemRow = {
  id_album: number;
  position: number;
  album?: ListAlbumRef | null;
};

/** "Me gusta" reducido a quién lo puso. Alcanza para contarlos y para saber si el que mira ya lo puso. */
export type ListLikeRow = {
  id_user: number;
};

/**
 * Lista tal como sale de este repositorio: con su autor, sus álbumes (en orden)
 * y quiénes le dieron "me gusta", cuando la consulta los trajo.
 *
 * Ninguna de esas propiedades está declarada en list.entity.ts, porque las
 * entidades son compartidas por todas las features y no se tocan desde una sola.
 */
export type ListWithRelations = List & {
  user?: ListUser | null;
  items?: ListItemRow[];
  likes?: ListLikeRow[];
};

/** Una lista reducida a de quién es: alcanza para autorizar una baja. */
export type ListOwner = {
  id_list: number;
  id_user: number;
};

/** El álbum al que se quiere agregar, reducido a lo que hace falta para validarlo. */
export type ListAlbumTarget = {
  id: number;
  title: string;
  state: ContentState;
};

/** Filtros opcionales del explorador. Sin ninguno, devuelve todas las listas. */
type ListFilters = {
  /** Deja solo las listas con al menos un álbum de este género. */
  genre?: number;
  /** Búsqueda parcial por nombre. */
  q?: string;
  idUser?: number;
  sort?: ListSort;
  limit?: number;
  offset?: number;
};

type CreateListData = {
  name: string;
  description: string | null;
  id_user: number;
};

type UpdateListData = {
  name?: string;
  description?: string | null;
};

// El autor viaja con cada lista: no hay tarjeta que la muestre sin decir de quién
// es. Los atributos se listan a mano para no mandar el email ni el rol.
const userInclude: IncludeOptions = {
  model: User,
  as: 'user',
  attributes: ['id_user', 'username', 'url_avatar'],
};

// Los álbumes de la lista viajan en el orden en que se agregaron (`position`), y
// no como el belongsToMany directo, porque ese atributo propio de la relación
// solo se puede pedir a través de la tabla intermedia.
//
// separate: true evita que se multiplique con el include de "me gusta": dos
// hasMany en la misma consulta se cruzan entre sí si no van aparte.
const itemsInclude: IncludeOptions = {
  model: ListAlbum,
  as: 'items',
  attributes: ['id_album', 'position'],
  separate: true,
  order: [['position', 'ASC']],
  include: [
    {
      model: Album,
      as: 'album',
      attributes: ['id_album', 'title', 'url_cover', 'release_year'],
      include: [{ model: Artist, as: 'artist', attributes: ['id_artist', 'name'] }],
    },
  ],
};

// Igual que los "me gusta" de una reseña: viajan como la lista de quiénes los
// pusieron, y no como un COUNT, porque la tarjeta necesita las dos cosas a la vez
// (cuántos son y si el que mira ya lo puso).
const likesInclude: IncludeOptions = {
  model: ListLike,
  as: 'likes',
  attributes: ['id_user'],
  separate: true,
};

const fullInclude = [userInclude, itemsInclude, likesInclude];

/**
 * Arma la cláusula where del explorador a partir de los filtros recibidos.
 * @param filters autor y/o texto a buscar.
 * @param listIds ids ya resueltos por el filtro de género, o undefined si no se pidió.
 */
function buildWhere(filters: ListFilters, listIds?: number[]) {
  return {
    ...(filters.idUser !== undefined ? { id_user: filters.idUser } : {}),
    ...(filters.q ? { name: { [Op.like]: `%${escapeLike(filters.q)}%` } } : {}),
    ...(listIds !== undefined ? { id_list: { [Op.in]: listIds } } : {}),
  };
}

/**
 * Traduce el orden pedido a la cláusula ORDER BY de Sequelize.
 *
 * "top" usa una subconsulta correlacionada, con el mismo recurso que
 * album.repository.ts para ordenar por cantidad de reseñas: el conteo de "me
 * gusta" no es una columna de LISTS y el include que los trae va con
 * `separate: true`, así que no se puede ordenar por él.
 *
 * @param sort criterio elegido; sin él, las más nuevas primero.
 */
function buildOrder(sort: ListSort = 'recent'): Order {
  switch (sort) {
    case 'top':
      return [
        [
          literal(
            '(SELECT COUNT(*) FROM `list_likes` WHERE `list_likes`.`id_list` = `List`.`id_list`)'
          ),
          'DESC',
        ],
        ['id_list', 'DESC'],
      ];
    case 'recent':
      return [
        ['creation_date', 'DESC'],
        ['id_list', 'DESC'],
      ];
  }
}

/**
 * Ids de las listas que tienen al menos un álbum del género pedido.
 *
 * Se resuelve como una consulta aparte y no como un include anidado con
 * `required: true` porque el género queda a dos saltos de LISTS (lista -> álbum
 * -> género), y filtrar ahí adentro dejaría en `items` solo los álbumes de ese
 * género en vez de la lista completa. Separar la consulta evita esa mezcla.
 *
 * @param idGenre género a buscar.
 */
async function findListIdsByGenre(idGenre: number): Promise<number[]> {
  const rows = await ListAlbum.findAll({
    attributes: ['id_list'],
    include: [
      {
        model: Album,
        as: 'album',
        attributes: [],
        include: [
          {
            model: Genre,
            as: 'genres',
            attributes: [],
            where: { id_genre: idGenre },
            through: { attributes: [] },
          },
        ],
      },
    ],
    group: ['id_list'],
  });

  return rows.map((row) => row.id_list);
}

export const listRepository = {
  findAll: async (filters: ListFilters = {}): Promise<ListWithRelations[]> => {
    let listIds: number[] | undefined;

    if (filters.genre !== undefined) {
      listIds = await findListIdsByGenre(filters.genre);

      // Ningún álbum de ese género está en ninguna lista todavía: se corta acá
      // para no mandarle a MySQL un IN () que no filtraría nada (mismo criterio
      // que el feed de amigos en review.repository.ts).
      if (listIds.length === 0) return [];
    }

    const lists = await List.findAll({
      where: buildWhere(filters, listIds),
      include: fullInclude,
      order: buildOrder(filters.sort),
      ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
      ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
    });

    return lists as ListWithRelations[];
  },

  findById: async (id_list: number): Promise<ListWithRelations | null> => {
    const list = await List.findByPk(id_list, { include: fullInclude });
    return list as ListWithRelations | null;
  },

  /**
   * La lista reducida a de quién es. Es todo lo que necesita la baja: traerla
   * con `findById` significaba cuatro consultas (la lista, su autor, sus álbumes
   * con artista y sus "me gusta") para armar un objeto que se iba a descartar
   * enseguida, porque un DELETE no devuelve nada.
   *
   * @returns null si esa lista no existe.
   */
  findOwner: async (id_list: number): Promise<ListOwner | null> => {
    const list = await List.findByPk(id_list, { attributes: ['id_list', 'id_user'] });
    if (!list) return null;

    return { id_list: list.id_list, id_user: list.id_user };
  },

  create: (data: CreateListData): Promise<ListWithRelations> => List.create(data),

  update: async (list: ListWithRelations, data: UpdateListData): Promise<ListWithRelations> => {
    // update() devuelve la misma instancia, así que conserva lo que ya había
    // traído el include.
    await list.update(data);
    return list;
  },

  /**
   * Borra la lista. Sus álbumes y sus "me gusta" se van con ella por el CASCADE
   * de la base (ver entities/index.ts), así que es un solo DELETE.
   */
  delete: async (id_list: number): Promise<void> => {
    await List.destroy({ where: { id_list } });
  },

  /**
   * El álbum al que se quiere agregar, con su estado de moderación: sin el
   * estado no se puede rechazar un alta sobre contenido que todavía nadie aprobó.
   * @returns null si ese álbum no existe.
   */
  findAlbumTarget: async (id_album: number): Promise<ListAlbumTarget | null> => {
    const album = await Album.findByPk(id_album, { attributes: ['id_album', 'title', 'state'] });
    if (!album) return null;

    return { id: album.id_album, title: album.title, state: album.state };
  },

  /**
   * Lo mismo que findAlbumTarget, para varios álbumes de una sola consulta. Lo
   * usa el alta, que valida todos los álbumes elegidos antes de crear la lista.
   *
   * @param ids álbumes a buscar.
   * @returns solo los que existen; el service compara contra lo que pidió para
   *   saber cuáles faltaron.
   */
  findAlbumTargets: async (ids: number[]): Promise<ListAlbumTarget[]> => {
    const albums = await Album.findAll({
      attributes: ['id_album', 'title', 'state'],
      where: { id_album: { [Op.in]: ids } },
    });

    return albums.map((album) => ({
      id: album.id_album,
      title: album.title,
      state: album.state,
    }));
  },

  // --- Álbumes de la lista ----------------------------------------------------

  /** ¿Ese álbum ya está en esa lista? */
  findItem: (id_list: number, id_album: number): Promise<ListAlbum | null> =>
    ListAlbum.findOne({ where: { id_list, id_album } }),

  /**
   * Próxima posición libre dentro de una lista: el siguiente entero después de
   * la más alta ya asignada. No hay pantalla para reordenar, así que alcanza con
   * ir siempre para adelante.
   */
  nextPosition: async (id_list: number): Promise<number> => {
    const max = (await ListAlbum.max('position', { where: { id_list } })) as number | null;
    return (max ?? 0) + 1;
  },

  addItem: (data: { id_list: number; id_album: number; position: number }): Promise<ListAlbum> =>
    ListAlbum.create(data),

  /** Agrega varios álbumes de una, con sus posiciones ya calculadas. Lo usa el alta. */
  addItems: async (rows: { id_list: number; id_album: number; position: number }[]): Promise<void> => {
    await ListAlbum.bulkCreate(rows);
  },

  removeItem: (item: ListAlbum): Promise<void> => item.destroy(),

  // --- "Me gusta" -------------------------------------------------------------

  /** ¿Este usuario ya le puso "me gusta" a esta lista? */
  findLike: (id_user: number, id_list: number): Promise<ListLike | null> =>
    ListLike.findOne({ where: { id_user, id_list } }),

  createLike: (id_user: number, id_list: number): Promise<ListLike> =>
    ListLike.create({ id_user, id_list }),

  deleteLike: (like: ListLike): Promise<void> => like.destroy(),
};
