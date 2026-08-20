// Lógica de negocio del CRUD de artistas: alta con moderación, listado filtrado,
// edición, baja y aprobación/rechazo. No conoce req ni res; recibe datos ya
// validados y al actor autenticado, y lanza errores de negocio que traduce el
// errorHandler.
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
import { ContentState } from '../../shared/types/enums';
import {
  artistRepository,
  ArtistAlbum,
  ArtistCreator,
  ArtistNameRow,
  ArtistWithRelations,
} from './artist.repository';
import { CreateArtistInput, ListArtistsQuery, UpdateArtistInput } from './artist.schema';

/**
 * Vista pública de un artista: es lo que sale en todas las respuestas de la API.
 *
 * Incluye sus álbumes (solo id y título) porque el panel de administración tiene
 * que mostrar qué depende del artista antes de borrarlo: la FK de ALBUMS es
 * RESTRICT y la baja se rechaza si tiene álbumes cargados.
 *
 * Incluye también quién lo cargó, para que la cola de moderación pueda mostrar de
 * quién es cada propuesta sin tener que pedir el usuario aparte.
 */
type PublicArtist = {
  id_artist: number;
  name: string;
  biography: string | null;
  state: ContentState;
  created_by: number | null;
  creator: ArtistCreator | null;
  albums: ArtistAlbum[];
};

/**
 * Arma la vista pública de un artista.
 * @param artist artista de la base, con sus álbumes y su autor si la consulta
 *   los trajo.
 */
function toPublicArtist(artist: ArtistWithRelations): PublicArtist {
  return {
    id_artist: artist.id_artist,
    name: artist.name,
    biography: artist.biography ?? null,
    state: artist.state,
    created_by: artist.created_by ?? null,
    // null tanto para lo que cargó el seed (que no tiene autor) como para un alta
    // recién hecha, que no pasó por el include.
    creator: artist.creator
      ? { id_user: artist.creator.id_user, username: artist.creator.username }
      : null,
    // Un artista recién creado no pasó por el include, y de todas formas todavía
    // no puede tener álbumes.
    albums: (artist.albums ?? []).map((album) => ({
      id_album: album.id_album,
      title: album.title,
    })),
  };
}

/**
 * Qué se le contesta a alguien que intenta cargar un artista repetido, según en
 * qué estado esté el que ya existe. No es lo mismo que ya esté en el catálogo que
 * que alguien lo haya propuesto y todavía nadie lo revise.
 */
const DUPLICATE_MESSAGES: Record<ContentState, (name: string) => string> = {
  approved: (name) => `"${name}" ya está cargado en el catálogo de Musicboxd.`,
  pending: (name) =>
    `Ya hay una propuesta de "${name}" esperando que un administrador la revise.`,
  rejected: (name) =>
    `"${name}" ya se había propuesto y un administrador rechazó esa propuesta.`,
};

/** Como mucho, cuántos parecidos se devuelven: es un aviso, no un listado. */
const MAX_SIMILAR = 5;

/**
 * Normaliza un nombre para poder compararlo: minúsculas, sin acentos y sin nada
 * que no sea una letra o un número. Así "2 Pac", "2-PAC" y "2pac" quedan iguales,
 * y "Charly García" se puede comparar con "charly garcia".
 */
function normalizeName(name: string): string {
  return (
    name
      .toLowerCase()
      // NFD separa cada letra acentuada en letra + acento aparte ("í" pasa a ser
      // "i" + tilde), y el filtro siguiente borra ese acento suelto junto con los
      // espacios y los signos: queda solo letras y números.
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '')
  );
}

/**
 * Distancia de edición (Levenshtein) entre dos textos: cuántas letras hay que
 * agregar, borrar o cambiar para convertir uno en el otro. Es lo que permite
 * detectar un error de tipeo, como "Spinnetta" contra "Spinetta".
 *
 * Se guarda solo la fila anterior de la matriz porque es la única que hace falta
 * para calcular la siguiente.
 */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1, // agregar una letra
        previous[j] + 1, // borrar una letra
        previous[j - 1] + cost // cambiar una letra
      );
    }

    previous = current;
  }

  return previous[b.length];
}

/** Palabras de un nombre, cada una normalizada por separado. */
function normalizeWords(name: string): string[] {
  return name
    .split(/\s+/)
    .map(normalizeName)
    .filter((word) => word !== '');
}

/**
 * ¿Dos textos ya normalizados están lo bastante cerca? Se cumple en dos casos:
 *
 *   - uno contiene al otro: "spinetta" está adentro de "luisalbertospinetta".
 *     Se pide que el más corto tenga al menos 4 letras, si no cualquier nombre
 *     corto aparecería adentro de medio catálogo.
 *   - están a una o dos letras de distancia: "2pacs" contra "2pac". El margen es
 *     más chico en textos cortos, donde dos letras ya son otra palabra.
 */
function isCloseEnough(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  if (shorter.length >= 4 && longer.includes(shorter)) return true;

  return editDistance(a, b) <= (shorter.length <= 6 ? 1 : 2);
}

/**
 * ¿El nombre que se está por cargar se parece al de un artista que ya existe?
 *
 * Primero compara los dos nombres completos. Si además lo que se escribió es una
 * sola palabra, la compara contra cada palabra del artista existente: así
 * "Spinnetta" encuentra a "Luis Alberto Spinetta" aunque le sobre una letra y no
 * esté contenido en el nombre completo.
 *
 * La comparación palabra por palabra se hace solo con una sola palabra escrita a
 * propósito: si se aplicara a los nombres largos, "Black Sabbath" y "Black Eyed
 * Peas" se avisarían entre ellos por compartir "Black".
 */
function looksLikeSameArtist(input: string, candidate: string): boolean {
  if (isCloseEnough(normalizeName(input), normalizeName(candidate))) return true;

  const inputWords = normalizeWords(input);
  // Menos de 4 letras es una palabra demasiado común para arriesgar un aviso.
  if (inputWords.length !== 1 || inputWords[0].length < 4) return false;

  return normalizeWords(candidate).some(
    (word) => word.length >= 4 && isCloseEnough(inputWords[0], word)
  );
}

/**
 * Corta con 409 si ya existe otro artista con el mismo nombre: cargar dos veces
 * al mismo artista rompería el catálogo (los álbumes quedarían repartidos entre
 * los dos registros).
 *
 * "El mismo nombre" se mide sobre el nombre normalizado, así que "2 Pac" choca
 * con "2pac". Los nombres apenas parecidos no se bloquean acá: los avisa
 * findSimilar y los confirma el usuario.
 *
 * @param name nombre a verificar, ya validado por Zod.
 * @param excludeId en una edición, el id del propio artista: que su nombre
 *   coincida consigo mismo no es un conflicto.
 */
async function assertNameAvailable(name: string, excludeId?: number): Promise<void> {
  const normalized = normalizeName(name);
  const artists = await artistRepository.findAllNames();

  const duplicate = artists.find(
    (artist) => artist.id_artist !== excludeId && normalizeName(artist.name) === normalized
  );

  if (duplicate) throw new ConflictError(DUPLICATE_MESSAGES[duplicate.state](duplicate.name));
}

/**
 * Busca el artista por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_artist: number): Promise<ArtistWithRelations> {
  const artist = await artistRepository.findById(id_artist);
  if (!artist) throw new NotFoundError('El artista');
  return artist;
}

/**
 * Corta con 403 si el actor no cargó ese artista y tampoco es ADMIN.
 * Mismo criterio de "dueño o admin" que user.service.ts, pero acá el dueño es
 * quien figura en created_by.
 */
function assertOwnerOrAdmin(artist: ArtistWithRelations, actor: TokenPayload): void {
  if (actor.rol !== 'ADMIN' && artist.created_by !== actor.id_user) {
    throw new ForbiddenError('Solo podés editar los artistas que cargaste vos.');
  }
}

/**
 * Cambia el estado de moderación de un artista. La usan approve y reject, que son
 * la misma operación con distinto estado final.
 * @param id_artist artista a moderar.
 * @param state estado que queda guardado.
 */
async function setState(id_artist: number, state: ContentState): Promise<PublicArtist> {
  const artist = await findExisting(id_artist);
  const updated = await artistRepository.update(artist, { state });
  return toPublicArtist(updated);
}

export const artistService = {
  /**
   * Da de alta un artista en el catálogo.
   *
   * Lo que carga un ADMIN entra ya aprobado; el aporte de un PRO queda pendiente
   * hasta que un ADMIN lo revise (ver el comentario de `state` en artist.entity.ts).
   *
   * @param data nombre y biografía ya validados.
   * @param actor usuario autenticado que hace la request.
   */
  async create(data: CreateArtistInput, actor: TokenPayload): Promise<PublicArtist> {
    await assertNameAvailable(data.name);

    const artist = await artistRepository.create({
      name: data.name,
      biography: data.biography ?? null,
      state: actor.rol === 'ADMIN' ? 'approved' : 'pending',
      // Queda registrado quién lo cargó: es lo que después lo habilita a editarlo.
      created_by: actor.id_user,
    });

    return toPublicArtist(artist);
  },

  /**
   * Lista los artistas del catálogo.
   * @param filters state, name, contributed y/o created_by que hayan llegado por
   *   query string.
   * @param actor usuario autenticado; define qué estados puede ver.
   */
  async list(filters: ListArtistsQuery, actor: TokenPayload): Promise<PublicArtist[]> {
    // Quiénes ven contenido sin aprobar: un ADMIN, porque es el que modera, y
    // cualquier usuario sobre sus propios aportes, porque necesita saber si se los
    // aprobaron o rechazaron. Para el resto el catálogo es solo lo aprobado: lo
    // pendiente todavía no lo revisó nadie y lo rechazado no tiene por qué volver
    // a aparecer.
    const seesEveryState = actor.rol === 'ADMIN' || filters.created_by === actor.id_user;
    const state = seesEveryState ? filters.state : 'approved';

    const artists = await artistRepository.findAll({
      state,
      name: filters.name,
      contributed: filters.contributed,
      createdBy: filters.created_by,
    });

    return artists.map(toPublicArtist);
  },

  /**
   * Busca artistas con un nombre parecido al que se quiere cargar.
   *
   * No bloquea nada: es el aviso que la interfaz usa para preguntar "¿seguro que
   * es otro artista?" antes de mandar la propuesta, y así no entran dos veces el
   * mismo con el nombre escrito distinto ("2Pacs" contra "2Pac").
   *
   * Deja afuera a los que tienen exactamente el mismo nombre normalizado, porque
   * esos ya los rechaza el alta con un mensaje claro, y a los rechazados, que no
   * forman parte del catálogo.
   *
   * @param name nombre que se está por cargar.
   * @param excludeId en una edición, el id del propio artista.
   */
  async findSimilar(name: string, excludeId?: number): Promise<ArtistNameRow[]> {
    const normalized = normalizeName(name);
    if (normalized === '') return [];

    const artists = await artistRepository.findAllNames();

    return artists
      .filter((artist) => {
        if (artist.id_artist === excludeId || artist.state === 'rejected') return false;
        // El que se llama exactamente igual no es un "parecido": ese lo rechaza
        // el alta con su propio mensaje.
        if (normalizeName(artist.name) === normalized) return false;

        return looksLikeSameArtist(name, artist.name);
      })
      .slice(0, MAX_SIMILAR);
  },

  /** Ficha de un artista puntual. */
  async getById(id_artist: number): Promise<PublicArtist> {
    const artist = await findExisting(id_artist);
    return toPublicArtist(artist);
  },

  /**
   * Actualiza el nombre y/o la biografía de un artista.
   * @param id_artist artista a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_artist: number,
    actor: TokenPayload,
    data: UpdateArtistInput
  ): Promise<PublicArtist> {
    const artist = await findExisting(id_artist);
    assertOwnerOrAdmin(artist, actor);

    // Renombrar también puede generar un duplicado, así que se chequea igual que
    // en el alta.
    if (data.name !== undefined) await assertNameAvailable(data.name, id_artist);

    // Si el que edita no es ADMIN, el artista vuelve a la cola de moderación: un
    // aporte ya aprobado que cambia de contenido necesita otra revisión. Si no,
    // alcanzaría con esperar la aprobación y después reemplazar el texto.
    const updated = await artistRepository.update(
      artist,
      actor.rol === 'ADMIN' ? data : { ...data, state: 'pending' }
    );

    return toPublicArtist(updated);
  },

  /**
   * Elimina un artista del catálogo. Solo un ADMIN, ni siquiera el PRO que lo
   * cargó: para sacar de circulación un aporte propio está el rechazo.
   * @param id_artist artista a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_artist: number, actor: TokenPayload): Promise<void> {
    if (actor.rol !== 'ADMIN') {
      throw new ForbiddenError('Solo un administrador puede eliminar un artista del catálogo.');
    }

    const artist = await findExisting(id_artist);

    // La garantía real la da la base: la FK de ALBUMS es RESTRICT y rechaza el
    // borrado de un artista que todavía tiene álbumes. Se chequea igual antes de
    // escribir para poder decir cuántos son y cuáles (mismo criterio que
    // assertAvailable en user.service.ts), y porque MySQL devuelve ese rechazo con
    // el errno 1217, que Sequelize no traduce a ForeignKeyConstraintError: sin
    // este chequeo la request terminaría en un 500 genérico en vez de un 409.
    const albums = artist.albums ?? [];
    if (albums.length > 0) {
      const detail = albums.length === 1 ? '1 álbum' : `${albums.length} álbumes`;
      throw new ConflictError(
        `No se puede eliminar a ${artist.name} porque tiene ${detail} en el catálogo: ` +
          `${albums.map((album) => album.title).join(', ')}.`
      );
    }

    await artistRepository.delete(artist);
  },

  /** Aprueba un aporte pendiente: pasa a formar parte del catálogo público. */
  approve: (id_artist: number): Promise<PublicArtist> => setState(id_artist, 'approved'),

  /** Rechaza un aporte: deja de mostrarse en el catálogo, pero no se borra. */
  reject: (id_artist: number): Promise<PublicArtist> => setState(id_artist, 'rejected'),
};
