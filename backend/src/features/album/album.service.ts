// Lógica de negocio del CRUD de álbumes: alta con moderación, listado filtrado,
// edición, baja y aprobación/rechazo. No conoce req ni res; recibe datos ya
// validados y al actor autenticado, y lanza errores de negocio que traduce el
// errorHandler.
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
import { ContentState } from '../../shared/types/enums';
import {
  albumRepository,
  AlbumArtist,
  AlbumCreator,
  AlbumGenre,
  AlbumSongReview,
  AlbumWithRelations,
} from './album.repository';
import {
  CreateAlbumInput,
  ExploreAlbumsQuery,
  ListAlbumsQuery,
  UpdateAlbumInput,
} from './album.schema';

/**
 * Vista pública de un álbum en el listado.
 *
 * Las canciones y las reseñas salen como un número y no como una lista: el
 * listado solo necesita contarlas (para la tabla del panel y para avisar qué
 * bloquea la baja), y el tracklist completo de cada uno de los cientos de álbumes
 * del catálogo sería un montón de datos que ninguna pantalla usa.
 */
type PublicAlbum = {
  id_album: number;
  title: string;
  release_year: number | null;
  url_cover: string | null;
  /** Promedio de las reseñas del álbum. Es un valor derivado que mantiene el CRUD de reseñas. */
  average_rating: number;
  state: ContentState;
  created_by: number | null;
  creator: AlbumCreator | null;
  artist: AlbumArtist | null;
  genres: AlbumGenre[];
  songs_count: number;
  reviews_count: number;
};

/** Canción del tracklist, con su propia calificación promedio. */
type PublicAlbumSong = {
  id_song: number;
  number_track: number;
  song_title: string;
  duration: number | null;
  state: ContentState;
  average_rating: number;
  reviews_count: number;
};

/**
 * Vista de la ficha de un álbum: los mismos datos del listado más el tracklist.
 * Es la que consume la página /albums/:id.
 */
type PublicAlbumDetail = PublicAlbum & {
  songs: PublicAlbumSong[];
};

/** Una década del explorador, con cuántos álbumes del catálogo caen adentro. */
type PublicDecade = {
  /** Nombre para mostrar ("1990s", "Antes de 1960"). */
  label: string;
  /** Los dos extremos, incluidos: es lo que se manda como year_from / year_to. */
  from: number;
  to: number;
  count: number;
};

/**
 * Las décadas que ofrece el explorador, de la más nueva a la más vieja.
 *
 * Son fijas y no salen de los datos a propósito: la grilla de /music tiene que
 * verse igual siempre, y un catálogo sin álbumes de los 70 no debería reordenar
 * la pantalla. Las que quedan en cero las esconde el frontend.
 *
 * La primera llega hasta 2100 (el máximo que admite la entidad) para que un
 * lanzamiento futuro no se quede sin década, y la última junta todo lo anterior a
 * 1960 en un solo grupo, que es como lo muestra el diseño.
 */
const DECADES: { label: string; from: number; to: number }[] = [
  { label: '2020s', from: 2020, to: 2100 },
  { label: '2010s', from: 2010, to: 2019 },
  { label: '2000s', from: 2000, to: 2009 },
  { label: '1990s', from: 1990, to: 1999 },
  { label: '1980s', from: 1980, to: 1989 },
  { label: '1970s', from: 1970, to: 1979 },
  { label: '1960s', from: 1960, to: 1969 },
  { label: 'Antes de 1960', from: 1900, to: 1959 },
];

/**
 * Qué se le contesta a alguien que intenta cargar un álbum repetido, según en qué
 * estado esté el que ya existe. No es lo mismo que ya esté en el catálogo que que
 * alguien lo haya propuesto y todavía nadie lo revise.
 */
const DUPLICATE_MESSAGES: Record<ContentState, (title: string) => string> = {
  approved: (title) => `Ese artista ya tiene "${title}" cargado en el catálogo de Musicboxd.`,
  pending: (title) =>
    `Ya hay una propuesta de "${title}" para ese artista esperando que un administrador la revise.`,
  rejected: (title) =>
    `"${title}" ya se había propuesto para ese artista y un administrador rechazó esa propuesta.`,
};

/**
 * Normaliza un título para poder compararlo: minúsculas, sin acentos y sin nada
 * que no sea una letra o un número. Así "OK Computer", "ok-computer" y
 * "okcomputer" quedan iguales.
 *
 * Es la misma idea que normalizeName en artist.service.ts, pero acá se aplica
 * SOLO dentro de un mismo artista: dos artistas distintos pueden tener los dos un
 * álbum llamado "Greatest Hits" y no es un duplicado.
 */
function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      // NFD separa cada letra acentuada en letra + acento aparte ("í" pasa a ser
      // "i" + tilde), y el filtro siguiente borra ese acento suelto junto con los
      // espacios y los signos: queda solo letras y números.
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '')
  );
}

/**
 * Promedio de calificación de una canción.
 *
 * Se calcula al leer porque SONG no tiene una columna derivada como sí la tiene
 * ALBUMS (ver el DER): la pista guarda sus reseñas y nada más.
 *
 * @param reviews reseñas de la canción, tal como las trajo el include.
 * @returns el promedio con dos decimales, o 0 si todavía no la reseñó nadie.
 */
function averageRating(reviews: AlbumSongReview[] = []): number {
  // Las ocultas y las borradas no cuentan: dejaron de ser opiniones publicadas.
  const published = reviews.filter((review) => review.state === 'published');
  if (published.length === 0) return 0;

  const total = published.reduce((sum, review) => sum + Number(review.rating), 0);
  // Dos decimales, la misma precisión que el DECIMAL(3,2) de ALBUMS.average_rating.
  return Math.round((total / published.length) * 100) / 100;
}

/** Cuántas reseñas publicadas tiene una canción. */
function publishedCount(reviews: AlbumSongReview[] = []): number {
  return reviews.filter((review) => review.state === 'published').length;
}

/**
 * Arma la vista pública de un álbum, sin el tracklist.
 * @param album álbum de la base, con las relaciones que haya traído la consulta.
 */
function toPublicAlbum(album: AlbumWithRelations): PublicAlbum {
  return {
    id_album: album.id_album,
    title: album.title,
    release_year: album.release_year ?? null,
    url_cover: album.url_cover ?? null,
    average_rating: Number(album.average_rating),
    state: album.state,
    created_by: album.created_by ?? null,
    // null tanto para lo que cargó el seed (que no tiene autor) como para un alta
    // recién hecha, que no pasó por el include.
    creator: album.creator
      ? { id_user: album.creator.id_user, username: album.creator.username }
      : null,
    artist: album.artist ? { id_artist: album.artist.id_artist, name: album.artist.name } : null,
    genres: (album.genres ?? []).map((genre) => ({
      id_genre: genre.id_genre,
      name: genre.name,
    })),
    songs_count: (album.songs ?? []).length,
    reviews_count: (album.reviews ?? []).length,
  };
}

/**
 * Arma la vista de la ficha: la del listado más el tracklist.
 * @param album álbum traído con el include detallado (ver findById).
 * @param onlyApprovedSongs true para dejar afuera las pistas que todavía nadie
 *   revisó: es lo que corresponde en la ficha pública.
 */
function toPublicAlbumDetail(
  album: AlbumWithRelations,
  onlyApprovedSongs: boolean
): PublicAlbumDetail {
  const songs = (album.songs ?? []).filter(
    (song) => !onlyApprovedSongs || song.state === 'approved'
  );

  return {
    ...toPublicAlbum(album),
    songs: songs.map((song) => ({
      id_song: song.id_song,
      number_track: song.number_track,
      song_title: song.song_title,
      duration: song.duration ?? null,
      state: song.state,
      average_rating: averageRating(song.reviews),
      reviews_count: publishedCount(song.reviews),
    })),
  };
}

/**
 * Busca el álbum por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_album: number): Promise<AlbumWithRelations> {
  const album = await albumRepository.findById(id_album);
  if (!album) throw new NotFoundError('El álbum');
  return album;
}

/**
 * Corta con 403 si el actor no cargó ese álbum y tampoco es ADMIN.
 * Mismo criterio de "dueño o admin" que artist.service.ts.
 */
function assertOwnerOrAdmin(album: AlbumWithRelations, actor: TokenPayload): void {
  if (actor.rol !== 'ADMIN' && album.created_by !== actor.id_user) {
    throw new ForbiddenError('Solo podés editar los álbumes que cargaste vos.');
  }
}

/**
 * Corta con 403 si el actor no puede eliminar ese álbum.
 *
 * Un ADMIN puede con cualquiera; el que lo cargó, solo con su propio aporte
 * mientras siga pendiente de revisión (ver el remove() del service).
 */
function assertCanDelete(album: AlbumWithRelations, actor: TokenPayload): void {
  if (actor.rol === 'ADMIN') return;

  if (album.created_by !== actor.id_user) {
    throw new ForbiddenError('Solo podés eliminar los álbumes que cargaste vos.');
  }

  if (album.state !== 'pending') {
    throw new ForbiddenError(
      'Solo podés eliminar un aporte que siga pendiente de revisión. Si ya se resolvió, pedile la baja a un administrador.'
    );
  }
}

/**
 * Corta con 400 si el artista elegido no existe.
 *
 * La FK de ALBUMS es NOT NULL, así que sin este chequeo el alta terminaría en un
 * error de base de datos con un mensaje que no le dice nada al usuario.
 */
async function assertArtistExists(id_artist: number): Promise<void> {
  const exists = await albumRepository.artistExists(id_artist);
  if (!exists) throw new BadRequestError('El artista elegido no existe en el catálogo.');
}

/**
 * Corta con 400 si alguno de los géneros elegidos no existe. Este CRUD no crea
 * géneros: solo vincula los que ya están cargados.
 * @param genreIds ids que llegaron en el body.
 */
async function assertGenresExist(genreIds: number[]): Promise<void> {
  if (genreIds.length === 0) return;

  const existing = await albumRepository.findExistingGenreIds(genreIds);
  const missing = genreIds.filter((id) => !existing.includes(id));

  if (missing.length > 0) {
    throw new BadRequestError(
      `No existe ningún género con el id ${missing.join(', ')}. Elegí géneros del catálogo.`
    );
  }
}

/**
 * Corta con 409 si ese artista ya tiene otro álbum con el mismo título: cargar
 * dos veces el mismo disco rompería el catálogo (las canciones y las reseñas
 * quedarían repartidas entre los dos registros).
 *
 * "El mismo título" se mide sobre el título normalizado, así que "OK Computer"
 * choca con "ok-computer".
 *
 * @param title título a verificar, ya validado por Zod.
 * @param id_artist artista al que se le está cargando el álbum.
 * @param excludeId en una edición, el id del propio álbum: que su título coincida
 *   consigo mismo no es un conflicto.
 */
async function assertTitleAvailable(
  title: string,
  id_artist: number,
  excludeId?: number
): Promise<void> {
  const normalized = normalizeTitle(title);
  const albums = await albumRepository.findTitlesByArtist(id_artist);

  const duplicate = albums.find(
    (album) => album.id_album !== excludeId && normalizeTitle(album.title) === normalized
  );

  if (duplicate) throw new ConflictError(DUPLICATE_MESSAGES[duplicate.state](duplicate.title));
}

/**
 * Arma el mensaje del 409 que bloquea la baja de un álbum.
 * @param album álbum que se quiso eliminar, con sus canciones y sus reseñas.
 */
function buildDeleteConflictMessage(album: AlbumWithRelations): string {
  const songs = (album.songs ?? []).length;
  const reviews = (album.reviews ?? []).length;

  const blockers: string[] = [];
  if (songs > 0) blockers.push(songs === 1 ? '1 canción' : `${songs} canciones`);
  if (reviews > 0) blockers.push(reviews === 1 ? '1 reseña' : `${reviews} reseñas`);

  return (
    `No se puede eliminar "${album.title}" porque tiene ${blockers.join(' y ')} en el catálogo. ` +
    'Hay que dar de baja eso primero.'
  );
}

/**
 * Cambia el estado de moderación de un álbum. La usan approve y reject, que son
 * la misma operación con distinto estado final.
 * @param id_album álbum a moderar.
 * @param state estado que queda guardado.
 */
async function setState(id_album: number, state: ContentState): Promise<PublicAlbumDetail> {
  const album = await findExisting(id_album);
  const updated = await albumRepository.update(album, { state });
  // false: el panel de moderación también mira las pistas que están pendientes.
  return toPublicAlbumDetail(updated, false);
}

export const albumService = {
  /**
   * Da de alta un álbum en el catálogo.
   *
   * Lo que carga un ADMIN entra ya aprobado; el aporte de un PRO queda pendiente
   * hasta que un ADMIN lo revise (ver el comentario de `state` en album.entity.ts).
   *
   * @param data título, año, portada, artista y géneros ya validados.
   * @param actor usuario autenticado que hace la request.
   */
  async create(data: CreateAlbumInput, actor: TokenPayload): Promise<PublicAlbumDetail> {
    const genreIds = data.genre_ids ?? [];

    await assertArtistExists(data.id_artist);
    await assertGenresExist(genreIds);
    await assertTitleAvailable(data.title, data.id_artist);

    const album = await albumRepository.create({
      title: data.title,
      release_year: data.release_year ?? null,
      url_cover: data.url_cover ?? null,
      state: actor.rol === 'ADMIN' ? 'approved' : 'pending',
      // Queda registrado quién lo cargó: es lo que después lo habilita a editarlo.
      created_by: actor.id_user,
      id_artist: data.id_artist,
    });

    await albumRepository.setGenres(album.id_album, genreIds);

    // Se vuelve a leer para devolverlo con su artista y sus géneros ya resueltos:
    // la instancia que devuelve create() no pasó por ningún include.
    return toPublicAlbumDetail(await findExisting(album.id_album), false);
  },

  /**
   * Lista los álbumes del catálogo.
   * @param filters state, title, id_artist, contributed y/o created_by que hayan
   *   llegado por query string.
   * @param actor usuario autenticado; define qué estados puede ver.
   */
  async list(filters: ListAlbumsQuery, actor: TokenPayload): Promise<PublicAlbum[]> {
    // Quiénes ven contenido sin aprobar: un ADMIN, porque es el que modera, y
    // cualquier usuario sobre sus propios aportes, porque necesita saber si se los
    // aprobaron o rechazaron. Para el resto el catálogo es solo lo aprobado: lo
    // pendiente todavía no lo revisó nadie y lo rechazado no tiene por qué volver
    // a aparecer.
    const seesEveryState = actor.rol === 'ADMIN' || filters.created_by === actor.id_user;
    const state = seesEveryState ? filters.state : 'approved';

    const albums = await albumRepository.findAll({
      state,
      title: filters.title,
      idArtist: filters.id_artist,
      contributed: filters.contributed,
      createdBy: filters.created_by,
    });

    return albums.map(toPublicAlbum);
  },

  /**
   * Listado del explorador público (/music y la página de listado de álbumes).
   *
   * No pide token y devuelve SIEMPRE el catálogo aprobado, así que no recibe el
   * actor: es la misma respuesta para un visitante sin cuenta que para un ADMIN.
   * Lo que sí recibe es el orden, el tope de filas y el rango de años, que es lo
   * que distingue a una sección de otra.
   *
   * @param filters orden, tope, rango de años y género ya validados.
   */
  async explore(filters: ExploreAlbumsQuery): Promise<PublicAlbum[]> {
    const albums = await albumRepository.findForExplore({
      sort: filters.sort,
      limit: filters.limit,
      offset: filters.offset,
      yearFrom: filters.year_from ?? undefined,
      yearTo: filters.year_to ?? undefined,
      idGenre: filters.id_genre,
    });

    return albums.map(toPublicAlbum);
  },

  /**
   * Cuántos álbumes del catálogo aprobado tiene cada década.
   *
   * Es lo que dibuja "Explorar por Década" en /music. Devuelve las ocho décadas
   * siempre, con su conteo: si alguna quedó en cero, es el frontend el que decide
   * no mostrarla.
   *
   * Los álbumes sin año no entran en ninguna: no se sabe a cuál pertenecen.
   */
  async decades(): Promise<PublicDecade[]> {
    const rows = await albumRepository.findApprovedReleaseYears();
    const years = rows
      .map((row) => row.release_year)
      .filter((year): year is number => year !== null);

    return DECADES.map((decade) => ({
      ...decade,
      count: years.filter((year) => year >= decade.from && year <= decade.to).length,
    }));
  },

  /**
   * Ficha pública de un álbum, con su tracklist.
   *
   * Es el único endpoint de esta feature que no pide token, igual que la lectura
   * de géneros: se llega a la ficha desde la página del género, que es pública.
   * Por eso devuelve SOLO álbumes aprobados y solo sus pistas aprobadas: lo que
   * todavía nadie revisó no forma parte del catálogo público, y sin token no hay
   * forma de saber si quien pregunta es el autor del aporte.
   */
  async getPublicById(id_album: number): Promise<PublicAlbumDetail> {
    const album = await findExisting(id_album);
    if (album.state !== 'approved') throw new NotFoundError('El álbum');

    return toPublicAlbumDetail(album, true);
  },

  /**
   * Actualiza los datos de un álbum.
   * @param id_album álbum a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_album: number,
    actor: TokenPayload,
    data: UpdateAlbumInput
  ): Promise<PublicAlbumDetail> {
    const album = await findExisting(id_album);
    assertOwnerOrAdmin(album, actor);

    if (data.id_artist !== undefined) await assertArtistExists(data.id_artist);
    if (data.genre_ids !== undefined) await assertGenresExist(data.genre_ids);

    // Cambiar el título o mudar el álbum a otro artista también puede generar un
    // duplicado, así que se chequea contra el artista que va a quedar.
    if (data.title !== undefined || data.id_artist !== undefined) {
      await assertTitleAvailable(
        data.title ?? album.title,
        data.id_artist ?? album.id_artist,
        id_album
      );
    }

    // Si el que edita no es ADMIN, el álbum vuelve a la cola de moderación: un
    // aporte ya aprobado que cambia de contenido necesita otra revisión. Si no,
    // alcanzaría con esperar la aprobación y después reemplazar los datos.
    const { genre_ids, ...albumData } = data;
    await albumRepository.update(
      album,
      actor.rol === 'ADMIN' ? albumData : { ...albumData, state: 'pending' }
    );

    // Los géneros solo se tocan si el formulario los mandó: un PATCH que cambia
    // el año no tiene por qué borrarle los géneros al álbum.
    if (genre_ids !== undefined) await albumRepository.setGenres(id_album, genre_ids);

    // Se vuelve a leer porque setGenres escribe la tabla intermedia por fuera de
    // la instancia: sin esto la respuesta traería los géneros viejos.
    return toPublicAlbumDetail(await findExisting(id_album), false);
  },

  /**
   * Elimina un álbum del catálogo.
   *
   * Un ADMIN puede borrar cualquiera. El que lo cargó, en cambio, solo mientras
   * su aporte siga PENDIENTE: hasta que un ADMIN no lo aprueba, la propuesta no
   * la ve nadie más, así que darla de baja no le saca nada a la comunidad.
   *
   * @param id_album álbum a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_album: number, actor: TokenPayload): Promise<void> {
    const album = await findExisting(id_album);
    assertCanDelete(album, actor);

    // La garantía real la da la base: las FK de SONG y de REVIEW hacia ALBUMS son
    // RESTRICT y rechazan el borrado de un álbum que todavía tiene canciones o
    // reseñas. Se chequea igual antes de escribir para poder decir cuántas son
    // (mismo criterio que el remove() de artist.service.ts), y porque MySQL
    // devuelve ese rechazo con el errno 1217, que Sequelize NO traduce a
    // ForeignKeyConstraintError (solo mapea 1451 y 1452): sin este chequeo la
    // request terminaría en un 500 genérico en vez de un 409.
    const hasSongs = (album.songs ?? []).length > 0;
    const hasReviews = (album.reviews ?? []).length > 0;

    if (hasSongs || hasReviews) {
      throw new ConflictError(buildDeleteConflictMessage(album));
    }

    await albumRepository.delete(album);
  },

  /** Aprueba un aporte pendiente: pasa a formar parte del catálogo público. */
  approve: (id_album: number): Promise<PublicAlbumDetail> => setState(id_album, 'approved'),

  /** Rechaza un aporte: deja de mostrarse en el catálogo, pero no se borra. */
  reject: (id_album: number): Promise<PublicAlbumDetail> => setState(id_album, 'rejected'),
};
