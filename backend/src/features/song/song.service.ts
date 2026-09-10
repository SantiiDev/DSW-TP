// Lógica de negocio del CRUD de canciones: alta con moderación, listado filtrado,
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
  songRepository,
  SongAlbum,
  SongCreator,
  SongReview,
  SongWithRelations,
} from './song.repository';
import {
  CreateSongInput,
  ExploreSongsQuery,
  ListSongsQuery,
  UpdateSongInput,
} from './song.schema';

/**
 * Vista pública de una canción: es lo que sale en todas las respuestas de la API.
 *
 * Incluye su álbum (con el artista de ese álbum) porque un título de canción sin
 * contexto no se puede leer: hay decenas de "Intro" en el catálogo.
 */
type PublicSong = {
  id_song: number;
  number_track: number;
  song_title: string;
  /** Duración en segundos, o null si no se conoce. */
  duration: number | null;
  state: ContentState;
  created_by: number | null;
  creator: SongCreator | null;
  /** null en una canción suelta: la FK hacia ALBUMS admite NULL. */
  album: SongAlbum | null;
  /** Promedio de las reseñas publicadas. Se calcula al leer (ver averageRating). */
  average_rating: number;
  reviews_count: number;
};

/**
 * Promedio de calificación de una canción.
 *
 * Se calcula al leer porque SONG no tiene una columna derivada como sí la tiene
 * ALBUMS (ver el DER): la pista guarda sus reseñas y nada más.
 *
 * @param reviews reseñas de la canción, tal como las trajo el include.
 * @returns el promedio con dos decimales, o 0 si todavía no la reseñó nadie.
 */
function averageRating(reviews: SongReview[] = []): number {
  // Las ocultas y las borradas no cuentan: dejaron de ser opiniones publicadas.
  const published = reviews.filter((review) => review.state === 'published');
  if (published.length === 0) return 0;

  const total = published.reduce((sum, review) => sum + Number(review.rating), 0);
  // Dos decimales, la misma precisión que el DECIMAL(3,2) de ALBUMS.average_rating.
  return Math.round((total / published.length) * 100) / 100;
}

/**
 * Arma la vista pública de una canción.
 * @param song canción de la base, con las relaciones que haya traído la consulta.
 */
function toPublicSong(song: SongWithRelations): PublicSong {
  const published = (song.reviews ?? []).filter((review) => review.state === 'published');

  return {
    id_song: song.id_song,
    number_track: song.number_track,
    song_title: song.song_title,
    duration: song.duration ?? null,
    state: song.state,
    created_by: song.created_by ?? null,
    // null tanto para lo que cargó el seed (que no tiene autor) como para un alta
    // recién hecha, que no pasó por el include.
    creator: song.creator
      ? { id_user: song.creator.id_user, username: song.creator.username }
      : null,
    album: song.album
      ? {
          id_album: song.album.id_album,
          title: song.album.title,
          release_year: song.album.release_year ?? null,
          url_cover: song.album.url_cover ?? null,
          artist: song.album.artist
            ? { id_artist: song.album.artist.id_artist, name: song.album.artist.name }
            : null,
        }
      : null,
    average_rating: averageRating(song.reviews),
    reviews_count: published.length,
  };
}

/**
 * Busca la canción por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_song: number): Promise<SongWithRelations> {
  const song = await songRepository.findById(id_song);
  if (!song) throw new NotFoundError('La canción');
  return song;
}

/**
 * Corta con 403 si el actor no cargó esa canción y tampoco es ADMIN.
 * Mismo criterio de "dueño o admin" que artist.service.ts y album.service.ts.
 */
function assertOwnerOrAdmin(song: SongWithRelations, actor: TokenPayload): void {
  if (actor.rol !== 'ADMIN' && song.created_by !== actor.id_user) {
    throw new ForbiddenError('Solo podés editar las canciones que cargaste vos.');
  }
}

/**
 * Corta con 403 si el actor no puede eliminar esa canción.
 *
 * Un ADMIN puede con cualquiera; el que la cargó, solo con su propio aporte
 * mientras siga pendiente de revisión (ver el remove() del service).
 */
function assertCanDelete(song: SongWithRelations, actor: TokenPayload): void {
  if (actor.rol === 'ADMIN') return;

  if (song.created_by !== actor.id_user) {
    throw new ForbiddenError('Solo podés eliminar las canciones que cargaste vos.');
  }

  if (song.state !== 'pending') {
    throw new ForbiddenError(
      'Solo podés eliminar un aporte que siga pendiente de revisión. Si ya se resolvió, pedile la baja a un administrador.'
    );
  }
}

/**
 * Corta con 400 si el álbum elegido no existe.
 *
 * Sin este chequeo el alta terminaría en un error de base de datos por la FK, con
 * un mensaje que no le dice nada al usuario.
 */
async function assertAlbumExists(id_album: number): Promise<void> {
  const exists = await songRepository.albumExists(id_album);
  if (!exists) throw new BadRequestError('El álbum elegido no existe en el catálogo.');
}

/**
 * Decide qué número de pista le toca a la canción.
 *
 * Si el formulario mandó uno, se respeta (y más adelante se chequea que esté
 * libre). Si no, se usa el siguiente al último del álbum, así cargar un tracklist
 * en orden no obliga a ir contando a mano.
 *
 * @param requested número que llegó en el body, si llegó alguno.
 * @param id_album álbum al que va la canción.
 */
async function resolveTrackNumber(
  requested: number | undefined,
  id_album: number
): Promise<number> {
  if (requested !== undefined) return requested;

  const tracks = await songRepository.findTracksByAlbum(id_album);
  if (tracks.length === 0) return 1;

  return Math.max(...tracks.map((track) => track.number_track)) + 1;
}

/**
 * Corta con 409 si esa pista ya está ocupada en el álbum.
 *
 * La regla la sostiene el índice UNIQUE (id_album, number_track) de la base (ver
 * song.entity.ts), pero el error que devolvería MySQL nombra columnas y no dice
 * qué canción está en el medio. Se chequea antes para poder explicarlo.
 *
 * En una canción suelta no hay nada que chequear: el UNIQUE de MySQL deja repetir
 * filas cuando id_album es NULL, que es justamente lo que se quiere ahí.
 *
 * @param id_album álbum al que va la canción, o null si es suelta.
 * @param number_track número de pista pedido.
 * @param excludeId en una edición, la propia canción: chocar consigo misma no es
 *   un conflicto.
 */
async function assertTrackAvailable(
  id_album: number | null,
  number_track: number,
  excludeId?: number
): Promise<void> {
  if (id_album === null) return;

  const tracks = await songRepository.findTracksByAlbum(id_album);
  const taken = tracks.find(
    (track) => track.id_song !== excludeId && track.number_track === number_track
  );

  if (taken) {
    throw new ConflictError(
      `La pista ${number_track} de ese álbum ya está ocupada por "${taken.song_title}". ` +
        'Elegí otro número de pista.'
    );
  }
}

/**
 * Cambia el estado de moderación de una canción. La usan approve y reject, que
 * son la misma operación con distinto estado final.
 * @param id_song canción a moderar.
 * @param state estado que queda guardado.
 */
async function setState(id_song: number, state: ContentState): Promise<PublicSong> {
  const song = await findExisting(id_song);
  const updated = await songRepository.update(song, { state });
  return toPublicSong(updated);
}

export const songService = {
  /**
   * Da de alta una canción.
   *
   * Lo que carga un ADMIN entra ya aprobado; el aporte de un PRO queda pendiente
   * hasta que un ADMIN lo revise (ver el comentario de `state` en song.entity.ts).
   *
   * @param data título, pista, duración y álbum ya validados.
   * @param actor usuario autenticado que hace la request.
   */
  async create(data: CreateSongInput, actor: TokenPayload): Promise<PublicSong> {
    // El álbum es obligatorio (ver el comentario de idAlbumSchema en el schema):
    // sin él la canción quedaría sin artista y sin ninguna pantalla desde la que
    // llegar a ella.
    const id_album = data.id_album;

    await assertAlbumExists(id_album);

    const number_track = await resolveTrackNumber(data.number_track, id_album);
    await assertTrackAvailable(id_album, number_track);

    const song = await songRepository.create({
      song_title: data.song_title,
      number_track,
      duration: data.duration ?? null,
      state: actor.rol === 'ADMIN' ? 'approved' : 'pending',
      // Queda registrado quién la cargó: es lo que después la habilita a editarla.
      created_by: actor.id_user,
      id_album,
    });

    // Se vuelve a leer para devolverla con su álbum ya resuelto: la instancia que
    // devuelve create() no pasó por ningún include.
    return toPublicSong(await findExisting(song.id_song));
  },

  /**
   * Lista las canciones del catálogo.
   * @param filters state, title, id_album, contributed y/o created_by que hayan
   *   llegado por query string.
   * @param actor usuario autenticado; define qué estados puede ver.
   */
  async list(filters: ListSongsQuery, actor: TokenPayload): Promise<PublicSong[]> {
    // Quiénes ven contenido sin aprobar: un ADMIN, porque es el que modera, y
    // cualquier usuario sobre sus propios aportes, porque necesita saber si se los
    // aprobaron o rechazaron. Para el resto el catálogo es solo lo aprobado.
    const seesEveryState = actor.rol === 'ADMIN' || filters.created_by === actor.id_user;
    const state = seesEveryState ? filters.state : 'approved';

    const songs = await songRepository.findAll({
      state,
      title: filters.title,
      idAlbum: filters.id_album,
      contributed: filters.contributed,
      createdBy: filters.created_by,
    });

    return songs.map(toPublicSong);
  },

  /**
   * Listado del explorador público (/music y la página de listado de canciones).
   *
   * No pide token y devuelve SIEMPRE el catálogo aprobado, así que no recibe el
   * actor: es la misma respuesta para un visitante sin cuenta que para un ADMIN.
   * Lo que sí recibe es el orden, el tope de filas y el rango de años, que es lo
   * que distingue a una sección de otra.
   *
   * @param filters orden, tope y rango de años ya validados.
   */
  async explore(filters: ExploreSongsQuery): Promise<PublicSong[]> {
    const songs = await songRepository.findForExplore({
      sort: filters.sort,
      limit: filters.limit,
      offset: filters.offset,
      yearFrom: filters.year_from,
      yearTo: filters.year_to,
    });

    return songs.map(toPublicSong);
  },

  /**
   * Ficha pública de una canción.
   *
   * Es el único endpoint de esta feature que no pide token, igual que la ficha de
   * álbum: se llega a ella desde el tracklist de /albums/:id, que es una página
   * abierta a cualquiera. Por eso devuelve SOLO canciones aprobadas: lo que
   * todavía nadie revisó no forma parte del catálogo público, y sin token no hay
   * forma de saber si quien pregunta es el autor del aporte.
   */
  async getPublicById(id_song: number): Promise<PublicSong> {
    const song = await findExisting(id_song);
    if (song.state !== 'approved') throw new NotFoundError('La canción');

    return toPublicSong(song);
  },

  /**
   * Actualiza los datos de una canción.
   * @param id_song canción a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_song: number,
    actor: TokenPayload,
    data: UpdateSongInput
  ): Promise<PublicSong> {
    const song = await findExisting(id_song);
    assertOwnerOrAdmin(song, actor);

    // Con qué álbum y qué pista va a quedar la canción después del cambio: los dos
    // se pueden tocar en el mismo PATCH, así que el chequeo se hace sobre el
    // resultado final y no sobre lo que había antes.
    //
    // nextAlbum puede ser null si la canción ya venía sin álbum de antes: la API
    // no deja crear ninguna así, pero la columna lo admite y pueden quedar filas
    // viejas. Editarla es justamente lo que permite asignarle un álbum.
    const nextAlbum = data.id_album ?? song.id_album ?? null;
    const nextTrack = data.number_track ?? song.number_track;

    if (data.id_album !== undefined) await assertAlbumExists(data.id_album);

    if (data.id_album !== undefined || data.number_track !== undefined) {
      await assertTrackAvailable(nextAlbum, nextTrack, id_song);
    }

    // Si el que edita no es ADMIN, la canción vuelve a la cola de moderación: un
    // aporte ya aprobado que cambia de contenido necesita otra revisión.
    await songRepository.update(
      song,
      actor.rol === 'ADMIN' ? data : { ...data, state: 'pending' }
    );

    // Se vuelve a leer porque mudar la canción a otro álbum deja desactualizado el
    // include que se había traído al principio.
    return toPublicSong(await findExisting(id_song));
  },

  /**
   * Elimina una canción del catálogo.
   *
   * Un ADMIN puede borrar cualquiera. Quien la cargó, en cambio, solo mientras
   * su aporte siga PENDIENTE: hasta que un ADMIN no lo aprueba, la propuesta no
   * la ve nadie más, así que darla de baja no le saca nada a la comunidad.
   *
   * A diferencia del álbum, acá no hay nada que bloquee la baja: la FK de REVIEW
   * hacia SONG es CASCADE, así que las reseñas de esa pista se van con ella. Una
   * reseña de canción califica esa pista y nada más (ver entities/index.ts).
   *
   * @param id_song canción a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_song: number, actor: TokenPayload): Promise<void> {
    const song = await findExisting(id_song);
    assertCanDelete(song, actor);

    await songRepository.delete(song);
  },

  /** Aprueba un aporte pendiente: pasa a formar parte del catálogo público. */
  approve: (id_song: number): Promise<PublicSong> => setState(id_song, 'approved'),

  /** Rechaza un aporte: deja de mostrarse en el catálogo, pero no se borra. */
  reject: (id_song: number): Promise<PublicSong> => setState(id_song, 'rejected'),
};
