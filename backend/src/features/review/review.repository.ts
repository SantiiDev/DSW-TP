// Acceso a datos de la feature review: consultas a la tabla review para el CRUD
// de reseñas. Es la única capa que habla con Sequelize.
import { IncludeOptions, Op } from 'sequelize';
import {
  Album,
  Artist,
  Review,
  ReviewComment,
  ReviewLike,
  Song,
  User,
} from '../../entities';
import { ContentState, ReviewState, ReviewTargetKind } from '../../shared/types/enums';

/** Autor de la reseña, reducido a lo que se muestra en su tarjeta. */
export type ReviewUser = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

/** Artista del álbum reseñado, para poder nombrarlo debajo del título. */
export type ReviewArtist = {
  id_artist: number;
  name: string;
};

/** Álbum reseñado, reducido a lo que hace falta para volver a su ficha. */
export type ReviewAlbum = {
  id_album: number;
  title: string;
  url_cover: string | null;
  /** Solo viaja cuando el álbum es el ítem reseñado, no cuando es el de una canción. */
  artist?: ReviewArtist | null;
};

/**
 * Canción reseñada. Trae su álbum porque la tarjeta de la reseña muestra la
 * carátula: una pista no tiene portada propia, usa la del disco.
 */
export type ReviewSong = {
  id_song: number;
  song_title: string;
  number_track: number;
  album?: ReviewAlbum | null;
};

/**
 * Reseña tal como sale de este repositorio: con su autor y con el ítem al que
 * apunta, cuando la consulta los trajo.
 *
 * Ninguna de esas propiedades está declarada en review.entity.ts, porque las
 * entidades son compartidas por todas las features y no se tocan desde una sola.
 * Se las agrega acá, que es la capa que sabe cómo está armada la consulta.
 *
 * `album` y `song` se excluyen entre sí: una reseña apunta a uno de los dos y el
 * otro queda en null (ver la validación de fila en review.entity.ts).
 */
export type ReviewWithRelations = Review & {
  user?: ReviewUser | null;
  album?: ReviewAlbum | null;
  song?: ReviewSong | null;
  likes?: ReviewLikeRow[];
  comments?: { id_comment: number }[];
};

/**
 * "Me gusta" reducido a quién lo puso. Alcanza para las dos cosas que se muestran:
 * cuántos son y si el que está mirando ya lo puso.
 */
export type ReviewLikeRow = {
  id_user: number;
};

/** Comentario con su autor, tal como se lista debajo de una reseña. */
export type ReviewCommentWithUser = ReviewComment & {
  user?: ReviewUser | null;
};

/**
 * Calificación de una reseña junto con a qué apuntaba. Es el insumo de las
 * estadísticas del perfil: el histograma sale de `rating`, y la cuenta de ítems
 * escuchados de saber cuáles eran álbumes y cuáles canciones.
 */
export type UserRatingRow = {
  rating: number;
  id_album: number | null;
  id_song: number | null;
};

/**
 * El ítem al que quiere apuntar una reseña, reducido a lo que hace falta para
 * validarlo: que exista y que esté aprobado.
 */
export type ReviewTarget = {
  id: number;
  title: string;
  state: ContentState;
};

/** A qué apunta una reseña. Siempre uno de los dos en null. */
export type ReviewTargetIds = {
  id_album: number | null;
  id_song: number | null;
};

/** Filtros opcionales del listado. Sin ninguno, devuelve todas las reseñas. */
type ReviewFilters = {
  idAlbum?: number;
  idSong?: number;
  /** Deja solo las reseñas de álbum, o solo las de canción, sin importar cuál. */
  targetKind?: ReviewTargetKind;
  idUser?: number;
  /** Feed de amigos: deja solo las reseñas de este conjunto de autores. */
  idUsers?: number[];
  state?: ReviewState;
  /** Deja solo las reseñas de esta calificación para arriba. */
  minRating?: number;
  limit?: number;
  offset?: number;
};

type CreateReviewData = {
  rating: number;
  text_review: string | null;
  id_user: number;
} & ReviewTargetIds;

type UpdateReviewData = {
  rating?: number;
  text_review?: string | null;
  state?: ReviewState;
  /** Se llena solo cuando edita el autor, no cuando modera un ADMIN. */
  edited_date?: Date;
};

// El autor viaja con cada reseña: no hay pantalla que muestre una sin decir quién
// la escribió. El hash de la contraseña ya lo excluye el defaultScope de USERS,
// pero los atributos se listan igual para no mandar el email ni el rol, que no
// tienen nada que hacer en una tarjeta de reseña.
const userInclude: IncludeOptions = {
  model: User,
  as: 'user',
  attributes: ['id_user', 'username', 'url_avatar'],
};

// Los dos ítems van con required: false (LEFT JOIN) porque una reseña apunta a
// UNO de los dos y el otro queda en NULL. Con el INNER JOIN que Sequelize usa por
// defecto, pedir los dos includes en la misma consulta no devolvería ni una fila.
const albumInclude: IncludeOptions = {
  model: Album,
  as: 'album',
  attributes: ['id_album', 'title', 'url_cover'],
  required: false,
  include: [{ model: Artist, as: 'artist', attributes: ['id_artist', 'name'] }],
};

const songInclude: IncludeOptions = {
  model: Song,
  as: 'song',
  attributes: ['id_song', 'song_title', 'number_track'],
  required: false,
  // El álbum de la pista, para la carátula y para el link a su ficha.
  include: [{ model: Album, as: 'album', attributes: ['id_album', 'title', 'url_cover'] }],
};

// Los "me gusta" viajan como la lista de quiénes los pusieron, y no como un
// COUNT, porque la tarjeta necesita las dos cosas: cuántos son y si el que está
// mirando ya lo puso. Con la lista se resuelven las dos sin una consulta aparte.
//
// Los comentarios, en cambio, viajan solo como ids: abajo de la reseña se muestra
// el número, y el texto se pide recién cuando alguien despliega el hilo.
//
// separate: true hace que Sequelize los pida en consultas aparte en vez de con un
// JOIN. Sin eso, dos hasMany en la misma consulta se multiplican entre sí y cada
// reseña aparecería tantas veces como "me gusta" por comentarios tenga.
const likesInclude: IncludeOptions = {
  model: ReviewLike,
  as: 'likes',
  attributes: ['id_user'],
  separate: true,
};

const commentIdsInclude: IncludeOptions = {
  model: ReviewComment,
  as: 'comments',
  attributes: ['id_comment'],
  separate: true,
};

// Las consultas de lectura traen lo mismo: quién la escribió, sobre qué, y cómo
// reaccionó la comunidad.
const fullInclude = [
  userInclude,
  albumInclude,
  songInclude,
  likesInclude,
  commentIdsInclude,
];

/**
 * Arma la cláusula where del listado a partir de los filtros recibidos.
 * @param filters ítem, autor, estado y/o calificación mínima a filtrar.
 * @returns el where listo para Sequelize; vacío si no vino ningún filtro.
 */
function buildWhere(filters: ReviewFilters) {
  return {
    ...(filters.idAlbum !== undefined ? { id_album: filters.idAlbum } : {}),
    ...(filters.idSong !== undefined ? { id_song: filters.idSong } : {}),
    // "Todas las de álbum" es "las que tienen id_album cargado": en la tabla, a
    // qué apunta una reseña se guarda como cuál de los dos ids quedó en NULL.
    ...(filters.targetKind === 'album' ? { id_album: { [Op.ne]: null } } : {}),
    ...(filters.targetKind === 'song' ? { id_song: { [Op.ne]: null } } : {}),
    ...(filters.idUser !== undefined ? { id_user: filters.idUser } : {}),
    // El feed de amigos filtra por un CONJUNTO de autores y no por uno solo. El
    // schema ya garantiza que id_user y following no lleguen juntos, así que
    // estos dos nunca se pisan sobre la misma columna.
    ...(filters.idUsers !== undefined ? { id_user: { [Op.in]: filters.idUsers } } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    // "De 4 estrellas para arriba" es el filtro del listado de reseñas del perfil.
    ...(filters.minRating !== undefined ? { rating: { [Op.gte]: filters.minRating } } : {}),
  };
}

/**
 * Traduce "a qué apunta la reseña" a una cláusula where.
 * Se mira cuál de los dos ids vino y se filtra por ese: buscar por los dos a la
 * vez daría siempre cero filas, porque uno de los dos es NULL en la base.
 */
function buildTargetWhere(target: ReviewTargetIds) {
  return target.id_album !== null ? { id_album: target.id_album } : { id_song: target.id_song };
}

export const reviewRepository = {
  findAll: async (filters: ReviewFilters = {}): Promise<ReviewWithRelations[]> => {
    const reviews = await Review.findAll({
      where: buildWhere(filters),
      include: fullInclude,
      // La más nueva primero, que es como se lee un muro de reseñas. El id
      // desempata para que dos reseñas publicadas en el mismo segundo no se
      // intercalen entre una tanda del paginado y la siguiente.
      order: [
        ['review_date', 'DESC'],
        ['id_review', 'DESC'],
      ],
      ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
      ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
    });

    return reviews as ReviewWithRelations[];
  },

  findById: async (id_review: number): Promise<ReviewWithRelations | null> => {
    const review = await Review.findByPk(id_review, { include: fullInclude });
    return review as ReviewWithRelations | null;
  },

  /**
   * La reseña que ese usuario ya tiene sobre ese ítem, o null si todavía no lo
   * reseñó.
   *
   * La usan el alta, para cortar con un 409 explicado antes de chocar contra el
   * índice único de la tabla, y GET /reviews/mine, para que el frontend sepa si el
   * botón tiene que decir "Escribir reseña" o "Editar mi reseña".
   *
   * @param id_user autor a buscar.
   * @param target álbum o canción sobre el que se busca.
   */
  findByUserAndTarget: async (
    id_user: number,
    target: ReviewTargetIds
  ): Promise<ReviewWithRelations | null> => {
    const review = await Review.findOne({
      where: { id_user, ...buildTargetWhere(target) },
      include: fullInclude,
    });

    return review as ReviewWithRelations | null;
  },

  create: (data: CreateReviewData): Promise<ReviewWithRelations> => Review.create(data),

  update: async (
    review: ReviewWithRelations,
    data: UpdateReviewData
  ): Promise<ReviewWithRelations> => {
    // update() devuelve la misma instancia, así que conserva lo que ya había
    // traído el include.
    await review.update(data);
    return review;
  },

  delete: (review: ReviewWithRelations): Promise<void> => review.destroy(),

  /**
   * El álbum al que se quiere apuntar, con su estado de moderación: sin el estado
   * no se puede rechazar una reseña sobre contenido que todavía nadie aprobó.
   * @returns null si ese álbum no existe.
   */
  findAlbumTarget: async (id_album: number): Promise<ReviewTarget | null> => {
    const album = await Album.findByPk(id_album, { attributes: ['id_album', 'title', 'state'] });
    if (!album) return null;

    return { id: album.id_album, title: album.title, state: album.state };
  },

  /** Lo mismo que findAlbumTarget, para una canción. */
  findSongTarget: async (id_song: number): Promise<ReviewTarget | null> => {
    const song = await Song.findByPk(id_song, {
      attributes: ['id_song', 'song_title', 'state'],
    });
    if (!song) return null;

    return { id: song.id_song, title: song.song_title, state: song.state };
  },

  /**
   * Calificaciones de las reseñas PUBLICADAS de un álbum. Es el insumo del
   * recálculo de ALBUMS.average_rating.
   *
   * Las ocultas quedan afuera porque dejaron de ser opiniones publicadas: es el
   * mismo criterio con el que album.service.ts promedia las de cada canción.
   *
   * No se usa `raw: true` a propósito: en crudo Sequelize saltea los getters y el
   * DECIMAL volvería como string, así que el promedio sería una concatenación.
   */
  findPublishedRatingsByAlbum: (id_album: number): Promise<{ rating: number }[]> =>
    Review.findAll({
      attributes: ['rating'],
      where: { id_album, state: 'published' },
    }),

  /**
   * Guarda el promedio recalculado en la columna derivada del álbum.
   *
   * Es la única escritura de esta feature fuera de la tabla `review`, y es
   * deliberada: ALBUMS.average_rating es un atributo derivado cuyo mantenimiento
   * está asignado por diseño al CRUD de reseñas (ver el comentario de la columna
   * en album.entity.ts y el punto correspondiente de proposal.md). Se hace con un
   * UPDATE directo y no cargando el álbum entero: es una sola columna y no hace
   * falta el resto de la fila.
   *
   * @param id_album álbum al que se le actualiza el promedio.
   * @param average promedio ya redondeado por el service.
   */
  saveAlbumAverage: async (id_album: number, average: number): Promise<void> => {
    await Album.update({ average_rating: average }, { where: { id_album } });
  },

  /**
   * Calificaciones publicadas de un usuario, con el ítem al que apuntaban.
   *
   * Es el insumo de las estadísticas del perfil. Se traen las filas y se agrupan
   * en el service en vez de usar un GROUP BY, con el mismo criterio que el conteo
   * por década de album.repository.ts: son unas pocas decenas de números por
   * usuario, y contarlas en JavaScript se lee mucho mejor que la consulta.
   */
  findPublishedRatingsByUser: (id_user: number): Promise<UserRatingRow[]> =>
    Review.findAll({
      attributes: ['rating', 'id_album', 'id_song'],
      where: { id_user, state: 'published' },
    }),

  // --- "Me gusta" -----------------------------------------------------------

  /** ¿Este usuario ya le puso "me gusta" a esta reseña? */
  findLike: (id_user: number, id_review: number): Promise<ReviewLike | null> =>
    ReviewLike.findOne({ where: { id_user, id_review } }),

  createLike: (id_user: number, id_review: number): Promise<ReviewLike> =>
    ReviewLike.create({ id_user, id_review }),

  deleteLike: (like: ReviewLike): Promise<void> => like.destroy(),

  // --- Comentarios ----------------------------------------------------------

  /**
   * Comentarios de una reseña, del más viejo al más nuevo: un hilo se lee en el
   * orden en que se escribió, al revés que el muro de reseñas.
   */
  findCommentsByReview: async (id_review: number): Promise<ReviewCommentWithUser[]> => {
    const comments = await ReviewComment.findAll({
      where: { id_review },
      include: [userInclude],
      order: [['comment_date', 'ASC']],
    });

    return comments as ReviewCommentWithUser[];
  },

  findCommentById: async (id_comment: number): Promise<ReviewCommentWithUser | null> => {
    const comment = await ReviewComment.findByPk(id_comment, { include: [userInclude] });
    return comment as ReviewCommentWithUser | null;
  },

  createComment: (data: {
    text_comment: string;
    id_review: number;
    id_user: number;
  }): Promise<ReviewComment> => ReviewComment.create(data),

  deleteComment: (comment: ReviewCommentWithUser): Promise<void> => comment.destroy(),
};
