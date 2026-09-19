// Lógica de negocio del CRUD de reseñas: alta, listado filtrado, edición, baja y
// moderación. No conoce req ni res; recibe datos ya validados y al actor
// autenticado, y lanza errores de negocio que traduce el errorHandler.
//
// Además de sus propias reglas, este service es el responsable de mantener
// ALBUMS.average_rating, que es un atributo derivado del DER: cada vez que cambia
// el conjunto de reseñas publicadas de un álbum hay que recalcularlo.
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
// El feed de amigos necesita saber a quiénes sigue el usuario, y de esa relación
// es dueña la feature follow. Se le pregunta a su service en vez de consultar la
// tabla follows desde acá: service -> service, sin saltear capas.
import { followService } from '../follow/follow.service';
// Las estadísticas avanzadas son un beneficio de Pro: para confirmar que la
// membresía siga vigente se le pregunta a la feature de suscripciones (que aplica
// el vencimiento) y se relee el rol del usuario, igual que hace payment.service.
import { subscriptionService } from '../subscription/subscription.service';
import { userRepository } from '../user/user.repository';
import { ReviewState } from '../../shared/types/enums';
import {
  reviewRepository,
  StatsAlbum,
  StatsReviewRow,
  ReviewAlbum,
  ReviewArtist,
  ReviewCommentWithUser,
  ReviewSong,
  ReviewTarget,
  ReviewTargetIds,
  ReviewUser,
  ReviewWithRelations,
} from './review.repository';
import {
  CreateCommentInput,
  CreateReviewInput,
  ListReviewsQuery,
  MyReviewQuery,
  UpdateReviewInput,
} from './review.schema';

/** Álbum reseñado, tal como sale en la respuesta de la API. */
type PublicReviewAlbum = {
  id_album: number;
  title: string;
  url_cover: string | null;
  artist: ReviewArtist | null;
};

/** Canción reseñada, con el álbum del que es pista. */
type PublicReviewSong = {
  id_song: number;
  song_title: string;
  number_track: number;
  album: PublicReviewAlbum | null;
};

/**
 * Vista pública de una reseña: es lo que sale en el listado, en el detalle, en el
 * alta y en la edición.
 *
 * `album` y `song` se excluyen entre sí y siempre viene uno de los dos: es la
 * regla del DER que la entidad valida a nivel de fila. Van los dos campos igual,
 * en vez de un "target" genérico, para que el frontend pueda distinguir sin
 * adivinar si la tarjeta linkea a /albums/:id o a /songs/:id.
 */
type PublicReview = {
  id_review: number;
  rating: number;
  text_review: string | null;
  review_date: Date;
  /** null mientras la reseña siga tal como se publicó. */
  edited_date: Date | null;
  state: ReviewState;
  user: ReviewUser | null;
  album: PublicReviewAlbum | null;
  song: PublicReviewSong | null;
  /** Cuántos "me gusta" tiene. */
  likes_count: number;
  /**
   * Si el usuario que hace la request ya le puso "me gusta". Es lo que decide si
   * el corazón se dibuja lleno o vacío. Siempre false sin sesión.
   */
  liked_by_me: boolean;
  /** Cuántos comentarios tiene. El texto se pide aparte, al desplegar el hilo. */
  comments_count: number;
};

/** Comentario de una reseña, tal como sale en la respuesta de la API. */
type PublicComment = {
  id_comment: number;
  text_comment: string;
  comment_date: Date;
  id_review: number;
  user: ReviewUser | null;
};

/**
 * Estadísticas de las reseñas de un usuario. Es lo que alimenta el histograma de
 * calificaciones y los contadores de su perfil.
 */
type PublicReviewStats = {
  /** Cuántas reseñas publicó. */
  total: number;
  /**
   * Cuántas reseñas puso en cada media estrella, de 0,5 a 5. Son diez posiciones,
   * en ese orden, que es exactamente lo que dibuja el histograma del perfil.
   */
  distribution: number[];
  /** Álbumes distintos que calificó. */
  albums: number;
  /** Canciones distintas que calificó. */
  songs: number;
};

/** Un género en el ranking de géneros. `id_genre` es null en el agregado "Otros". */
type StatsGenreEntry = {
  id_genre: number | null;
  name: string;
  count: number;
  /** Porcentaje sobre el total de apariciones de géneros, para dibujar el donut. */
  percentage: number;
};

/** Un artista en el ranking de artistas más reseñados. */
type StatsArtistEntry = {
  id_artist: number;
  name: string;
  count: number;
  average_rating: number;
  /** Portada de uno de sus álbumes reseñados: un artista no tiene foto propia. */
  url_cover: string | null;
};

/** Un álbum en el ranking de mejor calificados. */
type StatsAlbumEntry = {
  id_album: number;
  title: string;
  artist: string | null;
  url_cover: string | null;
  rating: number;
};

/**
 * Estadísticas avanzadas de un usuario en un año: "Tu año en música".
 *
 * Todo sale de sus reseñas publicadas, que es lo que Musicboxd sabe de lo que
 * escucha cada uno. Es el beneficio que desbloquea la membresía Pro (CUU 4).
 */
type PublicAdvancedStats = {
  year: number;
  /** Años con al menos una reseña, más el actual. Del más nuevo al más viejo. */
  available_years: number[];
  summary: {
    reviews: number;
    albums: number;
    songs: number;
    artists: number;
    genres: number;
    average_rating: number;
    /** Reseñas que además de la nota tienen texto. */
    written_reviews: number;
    /** Minutos de música calificada: la duración de cada canción o del álbum entero. */
    minutes: number;
  };
  /** Doce posiciones, de enero a diciembre. */
  monthly: { month: number; reviews: number; average_rating: number }[];
  top_genres: StatsGenreEntry[];
  top_artists: StatsArtistEntry[];
  top_albums: StatsAlbumEntry[];
  /** Décadas de lanzamiento de lo que reseñó, de la más vieja a la más nueva. */
  decades: { decade: number; count: number }[];
  /** Mismo formato que el histograma público: diez posiciones de 0,5 a 5. */
  distribution: number[];
  highlights: {
    /** 1 a 12, o null si no hay reseñas. */
    most_active_month: number | null;
    favorite_genre: string | null;
    most_common_rating: number | null;
  };
};

/** Dos decimales, la misma precisión que el DECIMAL(3,2) de ALBUMS.average_rating. */
const RATING_PRECISION = 100;

/** Cuántas posiciones tiene el histograma: de 0,5 a 5, de a media estrella. */
const DISTRIBUTION_SIZE = 10;

/** Cuántos puestos muestra cada ranking de las estadísticas avanzadas. */
const STATS_TOP_SIZE = 5;

/**
 * Cuenta cuántas calificaciones cayeron en cada media estrella.
 * @param ratings notas de 0,5 a 5.
 * @returns diez posiciones: la 0 es media estrella y la 9 son cinco.
 */
function buildDistribution(ratings: number[]): number[] {
  const distribution = new Array<number>(DISTRIBUTION_SIZE).fill(0);

  for (const rating of ratings) {
    // El índice sale de multiplicar la nota por dos y restar uno: 0,5 cae en el 0
    // y 5 en el 9.
    const index = Math.round(rating * 2) - 1;
    // El guardaviñas es por si alguna fila vieja quedó fuera de la escala: sin
    // él, un índice inválido rompería el arreglo en silencio.
    if (index >= 0 && index < DISTRIBUTION_SIZE) distribution[index] += 1;
  }

  return distribution;
}

/** Promedio redondeado a dos decimales; 0 si no hay valores. */
function averageOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * RATING_PRECISION) / RATING_PRECISION;
}

/**
 * El álbum del que salen artista, géneros y portada: el reseñado, o el de la
 * canción reseñada.
 */
function albumOfReview(row: StatsReviewRow): StatsAlbum | null {
  return row.album ?? row.song?.album ?? null;
}

/**
 * Segundos de música que representa una reseña: la duración de la canción, o la
 * suma del tracklist si se reseñó el álbum entero. Las pistas sin duración cargada
 * no suman.
 */
function secondsOfReview(row: StatsReviewRow): number {
  if (row.song) return row.song.duration ?? 0;
  return (row.album?.songs ?? []).reduce((total, song) => total + (song.duration ?? 0), 0);
}

/**
 * Ranking de géneros. Una reseña suma uno a cada género de su álbum, así que un
 * disco de "Rock" y "Alternativo" cuenta para los dos.
 *
 * Deja los cinco primeros y junta el resto en "Otros", para que el donut no se
 * llene de porciones finitas imposibles de leer.
 */
function buildTopGenres(rows: StatsReviewRow[]): StatsGenreEntry[] {
  const counts = new Map<number, { name: string; count: number }>();

  for (const row of rows) {
    for (const genre of albumOfReview(row)?.genres ?? []) {
      const entry = counts.get(genre.id_genre) ?? { name: genre.name, count: 0 };
      entry.count += 1;
      counts.set(genre.id_genre, entry);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  const total = sorted.reduce((sum, [, entry]) => sum + entry.count, 0);
  const toPercentage = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 1000) / 10);

  const top: StatsGenreEntry[] = sorted.slice(0, STATS_TOP_SIZE).map(([id_genre, entry]) => ({
    id_genre,
    name: entry.name,
    count: entry.count,
    percentage: toPercentage(entry.count),
  }));

  const othersCount = sorted.slice(STATS_TOP_SIZE).reduce((sum, [, entry]) => sum + entry.count, 0);
  if (othersCount > 0) {
    top.push({ id_genre: null, name: 'Otros', count: othersCount, percentage: toPercentage(othersCount) });
  }

  return top;
}

/**
 * Ranking de artistas por cantidad de reseñas. A igual cantidad gana el de mejor
 * promedio, que es a quien el usuario valoró más.
 */
function buildTopArtists(rows: StatsReviewRow[]): StatsArtistEntry[] {
  const byArtist = new Map<
    number,
    { name: string; ratings: number[]; url_cover: string | null }
  >();

  for (const row of rows) {
    const album = albumOfReview(row);
    if (!album?.artist) continue;

    const entry = byArtist.get(album.artist.id_artist) ?? {
      name: album.artist.name,
      ratings: [],
      url_cover: null,
    };
    entry.ratings.push(Number(row.rating));
    entry.url_cover = entry.url_cover ?? album.url_cover;
    byArtist.set(album.artist.id_artist, entry);
  }

  return [...byArtist.entries()]
    .map(([id_artist, entry]) => ({
      id_artist,
      name: entry.name,
      count: entry.ratings.length,
      average_rating: averageOf(entry.ratings),
      url_cover: entry.url_cover,
    }))
    .sort((a, b) => b.count - a.count || b.average_rating - a.average_rating)
    .slice(0, STATS_TOP_SIZE);
}

/**
 * Los álbumes mejor calificados. Solo cuentan las reseñas de álbum: la nota de una
 * canción no es la nota del disco.
 */
function buildTopAlbums(rows: StatsReviewRow[]): StatsAlbumEntry[] {
  return rows
    .filter((row) => row.album)
    // A igual nota, primero la reseña más reciente.
    .sort(
      (a, b) =>
        Number(b.rating) - Number(a.rating) ||
        new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
    )
    .slice(0, STATS_TOP_SIZE)
    .map((row) => ({
      id_album: row.album!.id_album,
      title: row.album!.title,
      artist: row.album!.artist?.name ?? null,
      url_cover: row.album!.url_cover ?? null,
      rating: Number(row.rating),
    }));
}

/** Cuántas reseñas cayeron en cada década de lanzamiento. */
function buildDecades(rows: StatsReviewRow[]): { decade: number; count: number }[] {
  const counts = new Map<number, number>();

  for (const row of rows) {
    const year = albumOfReview(row)?.release_year;
    if (!year) continue;
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ decade, count }));
}

/** Actividad de cada mes del año: cuántas reseñas y con qué promedio. */
function buildMonthly(rows: StatsReviewRow[]): PublicAdvancedStats['monthly'] {
  const ratingsByMonth = Array.from({ length: 12 }, () => [] as number[]);

  for (const row of rows) {
    ratingsByMonth[new Date(row.review_date).getMonth()].push(Number(row.rating));
  }

  return ratingsByMonth.map((ratings, index) => ({
    month: index + 1,
    reviews: ratings.length,
    average_rating: averageOf(ratings),
  }));
}

/**
 * Arma la vista pública de un álbum reseñado.
 * @param album álbum tal como lo trajo el include.
 */
function toPublicAlbum(album: ReviewAlbum): PublicReviewAlbum {
  return {
    id_album: album.id_album,
    title: album.title,
    url_cover: album.url_cover ?? null,
    // Solo lo trae el include del álbum reseñado. Cuando el álbum viaja como el
    // disco de una canción no se pide el artista, y queda en null.
    artist: album.artist
      ? { id_artist: album.artist.id_artist, name: album.artist.name }
      : null,
  };
}

/**
 * Arma la vista pública de una canción reseñada.
 * @param song canción tal como la trajo el include, con su álbum.
 */
function toPublicSong(song: ReviewSong): PublicReviewSong {
  return {
    id_song: song.id_song,
    song_title: song.song_title,
    number_track: song.number_track,
    album: song.album ? toPublicAlbum(song.album) : null,
  };
}

/**
 * Arma la vista pública del autor de una reseña o de un comentario.
 * @param user usuario tal como lo trajo el include.
 */
function toPublicUser(user: ReviewUser): ReviewUser {
  return {
    id_user: user.id_user,
    username: user.username,
    url_avatar: user.url_avatar ?? null,
  };
}

/**
 * Arma la vista pública de una reseña.
 * @param review reseña de la base, con las relaciones que haya traído la consulta.
 * @param actorId id del usuario que hace la request, o null si no hay sesión. Es
 *   lo único que hace falta para saber si el corazón va lleno o vacío.
 */
function toPublicReview(review: ReviewWithRelations, actorId: number | null): PublicReview {
  const likes = review.likes ?? [];

  return {
    id_review: review.id_review,
    // El getter de la entidad ya lo devuelve como número: la columna es un DECIMAL
    // y sin él llegaría como string.
    rating: review.rating,
    text_review: review.text_review ?? null,
    review_date: review.review_date,
    edited_date: review.edited_date ?? null,
    state: review.state,
    user: review.user ? toPublicUser(review.user) : null,
    album: review.album ? toPublicAlbum(review.album) : null,
    song: review.song ? toPublicSong(review.song) : null,
    likes_count: likes.length,
    // Los "me gusta" vienen como la lista de quiénes los pusieron, así que las dos
    // cosas que necesita la tarjeta salen de ahí sin otra consulta.
    liked_by_me: actorId !== null && likes.some((like) => like.id_user === actorId),
    comments_count: (review.comments ?? []).length,
  };
}

/**
 * Arma la vista pública de un comentario.
 * @param comment comentario de la base, con su autor.
 */
function toPublicComment(comment: ReviewCommentWithUser): PublicComment {
  return {
    id_comment: comment.id_comment,
    text_comment: comment.text_comment,
    comment_date: comment.comment_date,
    id_review: comment.id_review,
    user: comment.user ? toPublicUser(comment.user) : null,
  };
}

/**
 * Recalcula y guarda el promedio de calificación de un álbum a partir de sus
 * reseñas publicadas.
 *
 * Se llama después de cada operación que cambia ese conjunto: crear, editar,
 * borrar, ocultar y restaurar. Si no queda ninguna reseña publicada vuelve a 0,
 * que es como el frontend distingue "todavía no lo reseñó nadie" (el promedio no
 * puede dar 0 de verdad, porque la calificación mínima es media estrella).
 *
 * @param id_album álbum a recalcular.
 */
async function recalcAlbumAverage(id_album: number): Promise<void> {
  const reviews = await reviewRepository.findPublishedRatingsByAlbum(id_album);
  const average = averageOf(reviews.map((review) => review.rating));
  await reviewRepository.saveAlbumAverage(id_album, average);
}

/**
 * Recalcula el promedio solo si la reseña era de un álbum.
 *
 * Las reseñas de canción no disparan nada: SONG no tiene una columna derivada como
 * sí la tiene ALBUMS (ver el DER), su promedio lo calcula album.service.ts al leer
 * el tracklist.
 */
async function syncAlbumAverage(review: ReviewWithRelations): Promise<void> {
  if (review.id_album) await recalcAlbumAverage(review.id_album);
}

/**
 * Busca la reseña por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_review: number): Promise<ReviewWithRelations> {
  const review = await reviewRepository.findById(id_review);
  if (!review) throw new NotFoundError('La reseña');
  return review;
}

/**
 * Corta con 403 si el actor no escribió esa reseña.
 *
 * A diferencia del "dueño o admin" de album.service.ts, acá un ADMIN tampoco
 * puede: editarle el texto a otro sería ponerle palabras en la boca y firmarlas
 * con su nombre. Para sacar de circulación una reseña que viola las normas están
 * hide() y remove().
 */
function assertIsAuthor(review: ReviewWithRelations, actor: TokenPayload): void {
  if (review.id_user !== actor.id_user) {
    throw new ForbiddenError('Solo podés editar tus propias reseñas.');
  }
}

/**
 * Corta con 403 si el actor no escribió la reseña y tampoco es ADMIN. La baja sí
 * la puede hacer un administrador: es cómo se retira contenido que viola las
 * normas cuando ocultarlo no alcanza.
 */
function assertCanDelete(review: ReviewWithRelations, actor: TokenPayload): void {
  if (actor.rol !== 'ADMIN' && review.id_user !== actor.id_user) {
    throw new ForbiddenError('Solo podés eliminar tus propias reseñas.');
  }
}

/**
 * Corta con 400 si el ítem que se quiere reseñar no existe o todavía no está
 * aprobado.
 *
 * Solo se reseña contenido aprobado: lo pendiente no lo revisó nadie y lo
 * rechazado no forma parte del catálogo. Es el mismo criterio con el que
 * album.service.ts responde 404 sobre la ficha pública de un álbum sin aprobar.
 *
 * @param target lo que devolvió el repositorio, o null si no existe.
 * @param label cómo nombrarlo en el mensaje ("El álbum", "La canción").
 */
function assertReviewable(
  target: ReviewTarget | null,
  label: string
): asserts target is ReviewTarget {
  if (!target) {
    throw new BadRequestError(`${label} que querés reseñar no existe en el catálogo.`);
  }

  if (target.state !== 'approved') {
    throw new BadRequestError(
      `Todavía no se puede reseñar "${target.title}": un administrador tiene que aprobarlo primero.`
    );
  }
}

/**
 * Traduce el ítem que llegó en el body a los dos ids que guarda la tabla, después
 * de comprobar que se puede reseñar.
 *
 * @param data body ya validado; el schema garantiza que vino exactamente un id.
 * @returns los dos ids listos para guardar, con el que no corresponde en null.
 */
async function resolveTarget(data: {
  id_album?: number;
  id_song?: number;
}): Promise<ReviewTargetIds> {
  if (data.id_album !== undefined) {
    const album = await reviewRepository.findAlbumTarget(data.id_album);
    assertReviewable(album, 'El álbum');
    return { id_album: album.id, id_song: null };
  }

  if (data.id_song !== undefined) {
    const song = await reviewRepository.findSongTarget(data.id_song);
    assertReviewable(song, 'La canción');
    return { id_album: null, id_song: song.id };
  }

  // Inalcanzable si la request pasó por validate(): el schema exige exactamente
  // uno de los dos. Queda por si alguna vez se llama al service desde otro lado.
  throw new BadRequestError('Hay que indicar qué álbum o qué canción se está reseñando.');
}

/**
 * Corta con 409 si el usuario ya reseñó ese ítem.
 *
 * La garantía real la dan los índices únicos de la tabla (uq_review_user_album y
 * uq_review_user_song), pero se chequea antes de escribir para poder explicar qué
 * pasó: si se dejara chocar contra la base, Sequelize devolvería un error crudo de
 * MySQL y la request terminaría en un 500.
 */
async function assertNotAlreadyReviewed(
  id_user: number,
  target: ReviewTargetIds
): Promise<void> {
  const existing = await reviewRepository.findByUserAndTarget(id_user, target);

  if (existing) {
    throw new ConflictError(
      'Ya reseñaste esto. Podés editar tu reseña, o borrarla y escribir una nueva.'
    );
  }
}

/**
 * Cambia el estado de moderación de una reseña. La usan hide y restore, que son la
 * misma operación con distinto estado final.
 * @param id_review reseña a moderar.
 * @param state estado que queda guardado.
 * @param actor administrador que hace la request.
 */
async function setState(
  id_review: number,
  state: ReviewState,
  actor: TokenPayload
): Promise<PublicReview> {
  const review = await findExisting(id_review);
  const updated = await reviewRepository.update(review, { state });

  // El promedio del álbum cuenta solo las publicadas, así que ocultar o restaurar
  // lo mueve igual que un alta o una baja.
  await syncAlbumAverage(updated);
  return toPublicReview(updated, actor.id_user);
}

/**
 * Busca la reseña y corta si no se puede interactuar con ella.
 *
 * Una reseña oculta no se puede ni marcar con "me gusta" ni comentar: dejó de
 * mostrarse, así que reaccionar a algo que no se ve no significa nada.
 *
 * @param id_review reseña sobre la que se quiere interactuar.
 */
async function findInteractable(id_review: number): Promise<ReviewWithRelations> {
  const review = await findExisting(id_review);

  if (review.state !== 'published') {
    throw new NotFoundError('La reseña');
  }

  return review;
}

export const reviewService = {
  /**
   * Publica una reseña sobre un álbum o una canción.
   *
   * No pide ningún rol en particular: reseñar es lo que hace cualquier usuario
   * registrado, incluido un FREE. Es la diferencia con los CRUD de catálogo, donde
   * el alta exige PRO.
   *
   * @param data calificación, texto y el ítem reseñado, ya validados.
   * @param actor usuario autenticado que hace la request; es el autor.
   */
  async create(data: CreateReviewInput, actor: TokenPayload): Promise<PublicReview> {
    const target = await resolveTarget(data);
    await assertNotAlreadyReviewed(actor.id_user, target);

    const review = await reviewRepository.create({
      rating: data.rating,
      text_review: data.text_review ?? null,
      id_user: actor.id_user,
      ...target,
    });

    if (target.id_album !== null) await recalcAlbumAverage(target.id_album);

    // Se vuelve a leer para devolverla con su autor y su ítem ya resueltos: la
    // instancia que devuelve create() no pasó por ningún include.
    return toPublicReview(await findExisting(review.id_review), actor.id_user);
  },

  /**
   * Lista reseñas, filtradas y paginadas.
   *
   * Alimenta cinco pantallas con la misma consulta: las reseñas de un álbum, las
   * de una canción, las de un usuario (esta última, con el filtro por estrellas,
   * es el listado del perfil), las de un usuario acotadas a un tipo de ítem —que
   * son las pestañas "Álbumes" y "Canciones" calificados— y el feed social de
   * /reviews, con sus dos solapas.
   *
   * @param filters ítem, tipo de ítem, autor, estado, calificación mínima, feed de
   *   amigos, exclusión de las propias y paginado.
   * @param actor usuario autenticado, o null si es un visitante sin sesión.
   *   Define qué estados puede ver y de quién es el feed de amigos.
   */
  async list(filters: ListReviewsQuery, actor: TokenPayload | null): Promise<PublicReview[]> {
    // Las ocultas solo las ve un ADMIN, que es el que modera. Para cualquier otro
    // —incluido el visitante sin sesión— el listado es siempre lo publicado, sin
    // importar qué estado haya pedido. Mismo criterio que el listado de álbumes
    // con el contenido sin aprobar, y el mismo que ya aplica getById, que es
    // público desde siempre.
    const state = actor?.rol === 'ADMIN' ? filters.state : 'published';

    let idUsers: number[] | undefined;

    if (filters.following) {
      // El feed de amigos no existe sin saber quién pregunta: no hay forma de
      // resolverlo para un visitante.
      if (actor === null) {
        throw new UnauthorizedError('Necesitás iniciar sesión para ver el feed de amigos.');
      }

      idUsers = await followService.listFollowedIds(actor.id_user);

      // No seguir a nadie NO es un error: es el estado normal de una cuenta recién
      // creada. Se devuelve la lista vacía y el frontend muestra el mensaje que
      // invita a seguir gente. Además se corta acá para no mandarle a MySQL un
      // IN () que no filtraría nada.
      if (idUsers.length === 0) return [];
    }

    // Para un visitante no hay nada que excluir: el filtro se ignora en vez de
    // cortar con un 401, porque la solapa "Comunidad" es pública y sin sesión
    // tiene que seguir mostrando todo.
    const excludeIdUser = filters.exclude_mine && actor !== null ? actor.id_user : undefined;

    const reviews = await reviewRepository.findAll({
      idAlbum: filters.id_album,
      idSong: filters.id_song,
      targetKind: filters.target,
      idUser: filters.id_user,
      idUsers,
      excludeIdUser,
      state,
      minRating: filters.min_rating,
      limit: filters.limit,
      offset: filters.offset,
    });

    return reviews.map((review) => toPublicReview(review, actor?.id_user ?? null));
  },

  /**
   * Detalle de una reseña puntual: lo que muestra su página propia, que es a
   * donde apunta el enlace de "compartir".
   *
   * No pide token, igual que la ficha de un álbum, pero lo aprovecha si viene
   * (ver optionalAuth en la ruta). El actor decide dos cosas:
   *
   * - Si puede ver una reseña que no está publicada. Una oculta la siguen viendo
   *   su autor y un ADMIN, con el mismo criterio que getMine: si un moderador la
   *   ocultó, el autor tiene que poder enterarse en vez de encontrarse un 404.
   *   Además, sin esto el botón "Editar" del perfil llevaría a una pantalla rota.
   * - Si el corazón va lleno o vacío.
   *
   * @param id_review reseña a mostrar.
   * @param actor usuario autenticado, o null si el enlace lo abrió un visitante.
   */
  async getById(id_review: number, actor: TokenPayload | null): Promise<PublicReview> {
    const review = await findExisting(id_review);

    const isAuthor = actor !== null && review.id_user === actor.id_user;
    const isAdmin = actor?.rol === 'ADMIN';

    // Para cualquier otro, una reseña que no está publicada directamente no
    // existe: es el mismo 404 que devuelve la ficha de un álbum sin aprobar.
    if (review.state !== 'published' && !isAuthor && !isAdmin) {
      throw new NotFoundError('La reseña');
    }

    return toPublicReview(review, actor?.id_user ?? null);
  },

  /**
   * La reseña propia sobre un ítem, o null si el usuario todavía no lo reseñó.
   *
   * Es lo que le dice al frontend si el botón tiene que decir "Escribir reseña" o
   * "Editar mi reseña". A diferencia del listado devuelve la reseña sea cual sea su
   * estado: si un moderador la ocultó, el autor tiene que poder enterarse en vez de
   * ver el formulario en blanco como si nunca la hubiera escrito.
   *
   * @param query el álbum o la canción por el que se pregunta.
   * @param actor usuario autenticado; es de quien se busca la reseña.
   */
  async getMine(query: MyReviewQuery, actor: TokenPayload): Promise<PublicReview | null> {
    const review = await reviewRepository.findByUserAndTarget(actor.id_user, {
      id_album: query.id_album ?? null,
      id_song: query.id_song ?? null,
    });

    return review === null ? null : toPublicReview(review, actor.id_user);
  },

  /**
   * Cambia la calificación o el texto de una reseña. Solo su autor.
   * @param id_review reseña a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_review: number,
    actor: TokenPayload,
    data: UpdateReviewInput
  ): Promise<PublicReview> {
    const review = await findExisting(id_review);
    assertIsAuthor(review, actor);

    // Queda marcada como editada: lo que se está leyendo ya no es exactamente lo
    // que se publicó, y quien la lee tiene derecho a saberlo. Solo pasa por acá,
    // que es la única operación en la que el autor cambia el contenido; la
    // moderación (hide/restore) no la toca.
    const updated = await reviewRepository.update(review, {
      ...data,
      edited_date: new Date(),
    });

    // Cambiar la calificación mueve el promedio del álbum; cambiar solo el texto
    // no, pero recalcular igual sale barato y evita tener que preguntarlo.
    await syncAlbumAverage(updated);
    return toPublicReview(updated, actor.id_user);
  },

  /**
   * Elimina una reseña. Su autor, o un ADMIN.
   *
   * La baja es FÍSICA, a diferencia de la de un usuario: la fila se borra y el
   * autor queda libre de volver a reseñar ese ítem. Guardarla como 'deleted'
   * chocaría contra el índice único, que no distingue estados.
   *
   * @param id_review reseña a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_review: number, actor: TokenPayload): Promise<void> {
    const review = await findExisting(id_review);
    assertCanDelete(review, actor);

    // Se anota a qué apuntaba antes de borrarla: después del destroy() la
    // instancia ya no sirve para decidir qué álbum hay que recalcular.
    const idAlbum = review.id_album;

    await reviewRepository.delete(review);

    if (idAlbum) await recalcAlbumAverage(idAlbum);
  },

  /**
   * Oculta una reseña. Deja de listarse y de contar para el promedio del álbum,
   * pero la fila queda: es una medida de moderación reversible, no una baja.
   */
  hide: (id_review: number, actor: TokenPayload): Promise<PublicReview> =>
    setState(id_review, 'hidden', actor),

  /** Vuelve a publicar una reseña que estaba oculta. */
  restore: (id_review: number, actor: TokenPayload): Promise<PublicReview> =>
    setState(id_review, 'published', actor),

  /**
   * Estadísticas de las reseñas publicadas de un usuario.
   *
   * Es lo que dibuja el histograma de calificaciones de su perfil y lo que llena
   * sus contadores. Va como endpoint aparte y no derivado del listado porque el
   * listado está paginado: con una tanda de cinco reseñas no se puede calcular la
   * distribución de las cuarenta que tiene.
   *
   * @param id_user usuario del que se piden las estadísticas.
   */
  async stats(id_user: number): Promise<PublicReviewStats> {
    const rows = await reviewRepository.findPublishedRatingsByUser(id_user);

    return {
      total: rows.length,
      distribution: buildDistribution(rows.map((row) => row.rating)),
      albums: rows.filter((row) => row.id_album !== null).length,
      songs: rows.filter((row) => row.id_song !== null).length,
    };
  },

  /**
   * Estadísticas avanzadas propias de un año: "Tu año en música".
   *
   * Es el beneficio de Pro, así que antes de calcular nada se confirma que la
   * membresía siga vigente. requireRole ya cortó a un FREE, pero lee el rol del
   * token, y un token emitido antes de que venciera la membresía sigue diciendo PRO
   * hasta que expira. Por eso acá se aplica el vencimiento y se relee el rol de la
   * base. No se exige una suscripción activa: un PRO asignado desde el panel de
   * administración no tiene ninguna, y es Pro igual.
   *
   * @param actor usuario autenticado; las estadísticas son siempre las suyas.
   * @param year año pedido; sin él, el año en curso.
   */
  async advancedStats(actor: TokenPayload, year?: number): Promise<PublicAdvancedStats> {
    if (actor.rol === 'PRO') {
      await subscriptionService.getActive(actor.id_user, actor.rol);
      const user = await userRepository.findById(actor.id_user);

      if (!user || (user.rol !== 'PRO' && user.rol !== 'ADMIN')) {
        throw new ForbiddenError('Tu membresía Pro venció. Renovala para ver tus estadísticas.');
      }
    }

    const currentYear = new Date().getFullYear();
    const selectedYear = year ?? currentYear;

    const [rows, dates] = await Promise.all([
      reviewRepository.findPublishedForStats(
        actor.id_user,
        new Date(selectedYear, 0, 1),
        new Date(selectedYear + 1, 0, 1)
      ),
      reviewRepository.findPublishedDatesByUser(actor.id_user),
    ]);

    const ratings = rows.map((row) => Number(row.rating));
    const distribution = buildDistribution(ratings);
    const monthly = buildMonthly(rows);
    const topGenres = buildTopGenres(rows);

    const artistIds = new Set<number>();
    const genreIds = new Set<number>();
    for (const row of rows) {
      const album = albumOfReview(row);
      if (album?.artist) artistIds.add(album.artist.id_artist);
      for (const genre of album?.genres ?? []) genreIds.add(genre.id_genre);
    }

    const totalSeconds = rows.reduce((total, row) => total + secondsOfReview(row), 0);

    // Los destacados salen de los mismos cálculos: el mes con más reseñas, el
    // género que encabeza el ranking y la media estrella más repetida.
    const maxMonthly = Math.max(...monthly.map((entry) => entry.reviews));
    const maxDistribution = Math.max(...distribution);

    const availableYears = new Set<number>([currentYear]);
    for (const date of dates) availableYears.add(new Date(date).getFullYear());

    return {
      year: selectedYear,
      available_years: [...availableYears].sort((a, b) => b - a),
      summary: {
        reviews: rows.length,
        albums: rows.filter((row) => row.album).length,
        songs: rows.filter((row) => row.song).length,
        artists: artistIds.size,
        genres: genreIds.size,
        average_rating: averageOf(ratings),
        written_reviews: rows.filter((row) => row.text_review && row.text_review.trim() !== '')
          .length,
        minutes: Math.round(totalSeconds / 60),
      },
      monthly,
      top_genres: topGenres,
      top_artists: buildTopArtists(rows),
      top_albums: buildTopAlbums(rows),
      decades: buildDecades(rows),
      distribution,
      highlights: {
        most_active_month:
          rows.length === 0 ? null : monthly.find((entry) => entry.reviews === maxMonthly)!.month,
        favorite_genre: topGenres.find((genre) => genre.id_genre !== null)?.name ?? null,
        most_common_rating:
          rows.length === 0 ? null : (distribution.indexOf(maxDistribution) + 1) / 2,
      },
    };
  },

  /**
   * Pone o saca el "me gusta" del usuario sobre una reseña.
   *
   * Es una sola operación y no un alta y una baja separadas porque el corazón es
   * un interruptor: el frontend no tiene que saber en qué estado está para poder
   * apretarlo.
   *
   * @param id_review reseña sobre la que se reacciona.
   * @param actor usuario autenticado.
   * @returns la reseña con el conteo ya actualizado.
   */
  async toggleLike(id_review: number, actor: TokenPayload): Promise<PublicReview> {
    await findInteractable(id_review);

    const existing = await reviewRepository.findLike(actor.id_user, id_review);

    if (existing) await reviewRepository.deleteLike(existing);
    else await reviewRepository.createLike(actor.id_user, id_review);

    // Se vuelve a leer para que el conteo salga de la base y no de sumarle o
    // restarle uno a mano, que se desincroniza si dos personas reaccionan a la vez.
    return toPublicReview(await findExisting(id_review), actor.id_user);
  },

  /**
   * Comentarios de una reseña, del más viejo al más nuevo.
   *
   * Se piden aparte y no dentro de la reseña porque en la tarjeta solo se muestra
   * el número: el hilo se trae recién cuando alguien lo despliega.
   */
  async listComments(id_review: number): Promise<PublicComment[]> {
    // Se comprueba que la reseña exista para poder devolver un 404 claro en vez
    // de una lista vacía, que se leería como "todavía no comentó nadie".
    await findInteractable(id_review);

    const comments = await reviewRepository.findCommentsByReview(id_review);
    return comments.map(toPublicComment);
  },

  /**
   * Comenta una reseña. Cualquier usuario registrado, igual que reseñar.
   * @param id_review reseña que se comenta.
   * @param data texto ya validado.
   * @param actor usuario autenticado; es el autor del comentario.
   */
  async addComment(
    id_review: number,
    data: CreateCommentInput,
    actor: TokenPayload
  ): Promise<PublicComment> {
    await findInteractable(id_review);

    const comment = await reviewRepository.createComment({
      text_comment: data.text_comment,
      id_review,
      id_user: actor.id_user,
    });

    // Se vuelve a leer para devolverlo con su autor resuelto: la instancia que
    // devuelve create() no pasó por ningún include.
    const created = await reviewRepository.findCommentById(comment.id_comment);
    return toPublicComment(created!);
  },

  /**
   * Elimina un comentario. Su autor, o un ADMIN.
   *
   * El autor de la RESEÑA no puede borrar comentarios ajenos de su hilo: eso lo
   * dejaría elegir qué críticas se leen debajo de lo que escribió. Para eso está
   * la moderación de un administrador.
   *
   * @param id_comment comentario a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async removeComment(id_comment: number, actor: TokenPayload): Promise<void> {
    const comment = await reviewRepository.findCommentById(id_comment);
    if (!comment) throw new NotFoundError('El comentario');

    if (actor.rol !== 'ADMIN' && comment.id_user !== actor.id_user) {
      throw new ForbiddenError('Solo podés eliminar tus propios comentarios.');
    }

    await reviewRepository.deleteComment(comment);
  },
};
