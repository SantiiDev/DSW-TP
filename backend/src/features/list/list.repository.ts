// Acceso a datos de la feature list: consultas a las tablas lists, list_albums,
// list_songs y list_likes para el CRUD de listas personalizadas. Es la única capa
// que habla con Sequelize.
//
// Toda función que opera sobre los ítems de una lista recibe su `type` y elige
// contra qué tabla intermedia trabajar. El service nunca menciona una tabla: solo
// pasa el tipo de la lista que ya tiene en la mano.
import { IncludeOptions, Op, Order, literal } from 'sequelize';
import { Album, Artist, Genre, List, ListAlbum, ListLike, ListSong, Song, User } from '../../entities';
import { escapeLike } from '../../shared/db/like';
import { ContentState, ListType } from '../../shared/types/enums';
import { ListSort } from './list.schema';

/** Autor de la lista, reducido a lo que se muestra en su tarjeta. */
export type ListUser = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

/** Artista del ítem de una lista, para poder nombrarlo debajo del título. */
export type ListItemArtist = {
  id_artist: number;
  name: string;
};

/** Álbum tal como viaja dentro de una lista de álbumes. */
export type ListAlbumRef = {
  id_album: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist?: ListItemArtist | null;
};

/**
 * Canción tal como viaja dentro de una lista de canciones.
 *
 * Trae su álbum anidado porque una canción no tiene portada, año ni artista
 * propios: los tres los hereda del disco al que pertenece.
 */
export type ListSongRef = {
  id_song: number;
  song_title: string;
  album?: ListAlbumRef | null;
};

/** Fila de list_albums, con el álbum ya resuelto. */
export type ListAlbumRow = {
  id_album: number;
  position: number;
  album?: ListAlbumRef | null;
};

/** Fila de list_songs, con la canción ya resuelta. */
export type ListSongRow = {
  id_song: number;
  position: number;
  song?: ListSongRef | null;
};

/** "Me gusta" reducido a quién lo puso. Alcanza para contarlos y para saber si el que mira ya lo puso. */
export type ListLikeRow = {
  id_user: number;
};

/**
 * Lista tal como sale de este repositorio: con su autor, sus ítems (en orden) y
 * quiénes le dieron "me gusta", cuando la consulta los trajo.
 *
 * `albumItems` y `songItems` son excluyentes en la práctica: una lista de álbumes
 * nunca tiene filas en list_songs y viceversa. Se declaran los dos porque la
 * consulta es la misma para los dos tipos.
 *
 * Ninguna de esas propiedades está declarada en list.entity.ts, porque las
 * entidades son compartidas por todas las features y no se tocan desde una sola.
 */
export type ListWithRelations = List & {
  user?: ListUser | null;
  albumItems?: ListAlbumRow[];
  songItems?: ListSongRow[];
  likes?: ListLikeRow[];
};

/** Una lista reducida a de quién es. Alcanza para autorizar una baja. */
export type ListOwner = {
  id_list: number;
  id_user: number;
};

/**
 * El ítem que se quiere agregar, reducido a lo que hace falta para validarlo.
 * Es el mismo tipo para un álbum y para una canción: al service solo le importa
 * que exista y que esté aprobado.
 */
export type ListItemTarget = {
  id: number;
  title: string;
  state: ContentState;
};

/** Filtros opcionales del explorador. Sin ninguno, devuelve todas las listas. */
type ListFilters = {
  /** Deja solo las listas con al menos un ítem de este género. */
  genre?: number;
  /** Búsqueda parcial por nombre. */
  q?: string;
  idUser?: number;
  /** Solo listas de álbumes o solo de canciones. Sin esto, las dos. */
  type?: ListType;
  sort?: ListSort;
  limit?: number;
  offset?: number;
};

type CreateListData = {
  name: string;
  description: string | null;
  type: ListType;
  id_user: number;
};

type UpdateListData = {
  name?: string;
  description?: string | null;
};

/** Una fila a insertar en la tabla intermedia que corresponda al tipo de la lista. */
type NewItemRow = {
  id_list: number;
  id_item: number;
  position: number;
};

// El autor viaja con cada lista: no hay tarjeta que la muestre sin decir de quién
// es. Los atributos se listan a mano para no mandar el email ni el rol.
const userInclude: IncludeOptions = {
  model: User,
  as: 'user',
  attributes: ['id_user', 'username', 'url_avatar'],
};

// Los ítems de la lista viajan en el orden en que se agregaron (`position`), y
// no como el belongsToMany directo, porque ese atributo propio de la relación
// solo se puede pedir a través de la tabla intermedia.
//
// separate: true evita que se multipliquen entre sí y con el include de "me
// gusta": varios hasMany en la misma consulta se cruzan si no van aparte.
const albumItemsInclude: IncludeOptions = {
  model: ListAlbum,
  as: 'albumItems',
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

// El de canciones tiene un nivel más de anidado que el de álbumes: la canción
// cuelga de su álbum, y el álbum de su artista. Es lo que hace falta para poder
// dibujar una canción en una lista con portada y con el nombre del artista.
const songItemsInclude: IncludeOptions = {
  model: ListSong,
  as: 'songItems',
  attributes: ['id_song', 'position'],
  separate: true,
  order: [['position', 'ASC']],
  include: [
    {
      model: Song,
      as: 'song',
      attributes: ['id_song', 'song_title'],
      include: [
        {
          model: Album,
          as: 'album',
          attributes: ['id_album', 'title', 'url_cover', 'release_year'],
          include: [{ model: Artist, as: 'artist', attributes: ['id_artist', 'name'] }],
        },
      ],
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

// Se piden los dos tipos de ítem en la misma consulta y no solo el que
// corresponde al `type` de la lista: el include se arma antes de saber de qué
// tipo es cada fila, y al ir con `separate: true` el que no aplica vuelve vacío
// sin costo. Es lo que permite listar listas de los dos tipos de una sola vez.
const fullInclude = [userInclude, albumItemsInclude, songItemsInclude, likesInclude];

/**
 * Arma la cláusula where del explorador a partir de los filtros recibidos.
 * @param filters autor, tipo y/o texto a buscar.
 * @param listIds ids ya resueltos por el filtro de género, o undefined si no se pidió.
 */
function buildWhere(filters: ListFilters, listIds?: number[]) {
  return {
    ...(filters.idUser !== undefined ? { id_user: filters.idUser } : {}),
    ...(filters.type !== undefined ? { type: filters.type } : {}),
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
 * Ids de las listas de ÁLBUMES que tienen al menos un álbum del género pedido.
 *
 * Se resuelve como una consulta aparte y no como un include anidado con
 * `required: true` porque el género queda a dos saltos de LISTS (lista -> álbum
 * -> género), y filtrar ahí adentro dejaría en `albumItems` solo los álbumes de
 * ese género en vez de la lista completa. Separar la consulta evita esa mezcla.
 *
 * @param idGenre género a buscar.
 */
async function findAlbumListIdsByGenre(idGenre: number): Promise<number[]> {
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

/**
 * Lo mismo, para las listas de CANCIONES. El género queda un salto más lejos
 * (lista -> canción -> álbum -> género), porque los géneros del modelo cuelgan
 * del álbum y no de la pista: el género de una canción es el de su disco.
 *
 * @param idGenre género a buscar.
 */
async function findSongListIdsByGenre(idGenre: number): Promise<number[]> {
  const rows = await ListSong.findAll({
    attributes: ['id_list'],
    include: [
      {
        model: Song,
        as: 'song',
        attributes: [],
        include: [
          {
            model: Album,
            as: 'album',
            attributes: [],
            required: true,
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
      // Se preguntan las dos tablas y se unen los ids: el filtro por género
      // aplica a los dos tipos de lista, y sin filtro de tipo tienen que poder
      // convivir en el mismo resultado.
      const [albumLists, songLists] = await Promise.all([
        findAlbumListIdsByGenre(filters.genre),
        findSongListIdsByGenre(filters.genre),
      ]);
      listIds = [...new Set([...albumLists, ...songLists])];

      // Ningún ítem de ese género está en ninguna lista todavía: se corta acá
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
   * con `findById` significaba cinco consultas (la lista, su autor, sus álbumes,
   * sus canciones y sus "me gusta") para armar un objeto que se iba a descartar
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
   * Borra la lista. Sus ítems y sus "me gusta" se van con ella por el CASCADE
   * de la base (ver entities/index.ts), así que es un solo DELETE.
   */
  delete: async (id_list: number): Promise<void> => {
    await List.destroy({ where: { id_list } });
  },

  /**
   * El ítem al que se quiere agregar, con su estado de moderación: sin el estado
   * no se puede rechazar un alta sobre contenido que todavía nadie aprobó.
   *
   * @param type de qué es la lista; decide si el id es de un álbum o de una canción.
   * @returns null si ese ítem no existe.
   */
  findItemTarget: async (type: ListType, id: number): Promise<ListItemTarget | null> => {
    if (type === 'album') {
      const album = await Album.findByPk(id, { attributes: ['id_album', 'title', 'state'] });
      return album ? { id: album.id_album, title: album.title, state: album.state } : null;
    }

    const song = await Song.findByPk(id, { attributes: ['id_song', 'song_title', 'state'] });
    return song ? { id: song.id_song, title: song.song_title, state: song.state } : null;
  },

  /**
   * Lo mismo que findItemTarget, para varios ítems de una sola consulta. Lo usa
   * el alta, que valida todos los elegidos antes de crear la lista.
   *
   * @param type de qué es la lista.
   * @param ids ítems a buscar.
   * @returns solo los que existen; el service compara contra lo que pidió para
   *   saber cuáles faltaron.
   */
  findItemTargets: async (type: ListType, ids: number[]): Promise<ListItemTarget[]> => {
    if (type === 'album') {
      const albums = await Album.findAll({
        attributes: ['id_album', 'title', 'state'],
        where: { id_album: { [Op.in]: ids } },
      });

      return albums.map((album) => ({
        id: album.id_album,
        title: album.title,
        state: album.state,
      }));
    }

    const songs = await Song.findAll({
      attributes: ['id_song', 'song_title', 'state'],
      where: { id_song: { [Op.in]: ids } },
    });

    return songs.map((song) => ({
      id: song.id_song,
      title: song.song_title,
      state: song.state,
    }));
  },

  // --- Ítems de la lista ------------------------------------------------------
  //
  // Las cinco funciones que siguen son el mismo par de operaciones sobre dos
  // tablas distintas. El `type` de la lista es lo único que decide cuál.

  /** ¿Ese ítem ya está en esa lista? */
  hasItem: async (type: ListType, id_list: number, id_item: number): Promise<boolean> => {
    const row =
      type === 'album'
        ? await ListAlbum.findOne({ where: { id_list, id_album: id_item } })
        : await ListSong.findOne({ where: { id_list, id_song: id_item } });

    return row !== null;
  },

  /**
   * Próxima posición libre dentro de una lista: el siguiente entero después de
   * la más alta ya asignada. No hay pantalla para reordenar, así que alcanza con
   * ir siempre para adelante.
   */
  nextPosition: async (type: ListType, id_list: number): Promise<number> => {
    const max = (await (type === 'album'
      ? ListAlbum.max('position', { where: { id_list } })
      : ListSong.max('position', { where: { id_list } }))) as number | null;

    return (max ?? 0) + 1;
  },

  /** Agrega varios ítems de una, con sus posiciones ya calculadas. Lo usa el alta. */
  addItems: async (type: ListType, rows: NewItemRow[]): Promise<void> => {
    if (type === 'album') {
      await ListAlbum.bulkCreate(
        rows.map((row) => ({ id_list: row.id_list, id_album: row.id_item, position: row.position }))
      );
      return;
    }

    await ListSong.bulkCreate(
      rows.map((row) => ({ id_list: row.id_list, id_song: row.id_item, position: row.position }))
    );
  },

  addItem: async (type: ListType, row: NewItemRow): Promise<void> => {
    if (type === 'album') {
      await ListAlbum.create({
        id_list: row.id_list,
        id_album: row.id_item,
        position: row.position,
      });
      return;
    }

    await ListSong.create({
      id_list: row.id_list,
      id_song: row.id_item,
      position: row.position,
    });
  },

  /** @returns false si ese ítem no estaba en la lista, para que el service tire 404. */
  removeItem: async (type: ListType, id_list: number, id_item: number): Promise<boolean> => {
    const deleted =
      type === 'album'
        ? await ListAlbum.destroy({ where: { id_list, id_album: id_item } })
        : await ListSong.destroy({ where: { id_list, id_song: id_item } });

    return deleted > 0;
  },

  // --- "Me gusta" -------------------------------------------------------------

  /** ¿Este usuario ya le puso "me gusta" a esta lista? */
  findLike: (id_user: number, id_list: number): Promise<ListLike | null> =>
    ListLike.findOne({ where: { id_user, id_list } }),

  createLike: (id_user: number, id_list: number): Promise<ListLike> =>
    ListLike.create({ id_user, id_list }),

  deleteLike: (like: ListLike): Promise<void> => like.destroy(),
};
