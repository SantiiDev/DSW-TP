// Lógica de negocio del CRUD de géneros: alta, listado filtrado, edición y baja.
// No conoce req ni res; recibe datos ya validados y lanza errores de negocio que
// traduce el errorHandler.
//
// A diferencia de artist.service.ts, acá no hay chequeos de "dueño o admin": el
// género no tiene created_by ni state porque no es contenido aportable, sino la
// taxonomía con la que se ordena el catálogo. Toda la escritura es de ADMIN y eso
// ya lo corta requireRole en las rutas, así que el service se ocupa únicamente de
// las reglas del dominio.
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { ContentState } from '../../shared/types/enums';
import { genreRepository, GenreAlbum, GenreWithAlbums } from './genre.repository';
import { CreateGenreInput, ListGenresQuery, UpdateGenreInput } from './genre.schema';

/**
 * Vista pública de un género: es lo que sale en todas las respuestas de la API.
 *
 * Incluye sus álbumes (id, título y estado) porque los necesitan las dos puntas:
 * la grilla pública muestra cuántos álbumes aprobados tiene cada género, y el
 * panel de administración tiene que saber qué depende del género antes de
 * intentar borrarlo.
 */
type PublicGenre = {
  id_genre: number;
  name: string;
  albums: PublicGenreAlbum[];
};

type PublicGenreAlbum = {
  id_album: number;
  title: string;
  state: ContentState;
};

/**
 * Arma la vista pública de un género.
 * @param genre género de la base, con sus álbumes si la consulta los trajo.
 */
function toPublicGenre(genre: GenreWithAlbums): PublicGenre {
  return {
    id_genre: genre.id_genre,
    name: genre.name,
    // Un género recién creado no pasó por el include, y de todas formas todavía
    // no puede tener álbumes.
    albums: (genre.albums ?? []).map((album) => ({
      id_album: album.id_album,
      title: album.title,
      state: album.state,
    })),
  };
}

/** Cuántos títulos se nombran en el mensaje que rechaza una baja. */
const MAX_LISTED_ALBUMS = 3;

/**
 * Normaliza un nombre para poder compararlo: minúsculas, sin acentos y sin nada
 * que no sea una letra o un número. Así "R & B" y "R&B" quedan iguales, y
 * "Electrónica" se puede comparar con "electronica".
 *
 * Es la misma idea que usa artist.service.ts, pero sin la comparación por
 * parecido (distancia de edición): son once géneros que administra un ADMIN, no
 * un catálogo abierto donde haga falta avisar de un error de tipeo.
 */
function normalizeName(name: string): string {
  return (
    name
      .toLowerCase()
      // NFD separa cada letra acentuada en letra + acento aparte ("ó" pasa a ser
      // "o" + tilde), y el filtro siguiente borra ese acento suelto junto con los
      // espacios y los signos: queda solo letras y números.
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '')
  );
}

/**
 * Corta con 409 si ya existe otro género con el mismo nombre: tener el género
 * repetido partiría el catálogo en dos, con los álbumes repartidos entre ambos.
 *
 * "El mismo nombre" se mide sobre el nombre normalizado, así que "R & B" choca
 * con "R&B".
 *
 * @param name nombre a verificar, ya validado por Zod.
 * @param excludeId en una edición, el id del propio género: que su nombre
 *   coincida consigo mismo no es un conflicto.
 */
async function assertNameAvailable(name: string, excludeId?: number): Promise<void> {
  const normalized = normalizeName(name);
  const genres = await genreRepository.findAllNames();

  const duplicate = genres.find(
    (genre) => genre.id_genre !== excludeId && normalizeName(genre.name) === normalized
  );

  if (duplicate) {
    throw new ConflictError(`"${duplicate.name}" ya está cargado como género en Musicboxd.`);
  }
}

/**
 * Busca el género por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_genre: number): Promise<GenreWithAlbums> {
  const genre = await genreRepository.findById(id_genre);
  if (!genre) throw new NotFoundError('El género');
  return genre;
}

/**
 * Arma el mensaje que explica por qué no se puede borrar un género.
 * Se nombran solo los primeros títulos: un género del catálogo puede tener
 * decenas de álbumes y listarlos todos daría un mensaje ilegible.
 *
 * @param name nombre del género que se quiso borrar.
 * @param albums álbumes que lo tienen asignado.
 */
function buildDeleteConflictMessage(name: string, albums: GenreAlbum[]): string {
  const detail = albums.length === 1 ? '1 álbum' : `${albums.length} álbumes`;
  const listed = albums.slice(0, MAX_LISTED_ALBUMS).map((album) => album.title);
  const rest = albums.length - listed.length;
  const examples = rest > 0 ? `${listed.join(', ')} y ${rest} más` : listed.join(', ');

  return (
    `No se puede eliminar el género "${name}" porque tiene ${detail} asignados: ${examples}. ` +
    `Hay que desvincular esos álbumes antes de borrarlo.`
  );
}

export const genreService = {
  /**
   * Da de alta un género. Solo ADMIN, que es lo que corta requireRole en la ruta.
   * @param data nombre ya validado.
   */
  async create(data: CreateGenreInput): Promise<PublicGenre> {
    await assertNameAvailable(data.name);

    const genre = await genreRepository.create({ name: data.name });
    return toPublicGenre(genre);
  },

  /**
   * Lista los géneros del catálogo.
   * @param filters name que haya llegado por query string.
   */
  async list(filters: ListGenresQuery): Promise<PublicGenre[]> {
    const genres = await genreRepository.findAll({ name: filters.name });
    return genres.map(toPublicGenre);
  },

  /** Ficha de un género puntual, con los álbumes que lo tienen asignado. */
  async getById(id_genre: number): Promise<PublicGenre> {
    const genre = await findExisting(id_genre);
    return toPublicGenre(genre);
  },

  /**
   * Cambia el nombre de un género.
   * @param id_genre género a modificar.
   * @param data nombre nuevo, ya validado por Zod.
   */
  async update(id_genre: number, data: UpdateGenreInput): Promise<PublicGenre> {
    const genre = await findExisting(id_genre);

    // Renombrar también puede generar un duplicado, así que se chequea igual que
    // en el alta.
    await assertNameAvailable(data.name, id_genre);

    const updated = await genreRepository.update(genre, { name: data.name });
    return toPublicGenre(updated);
  },

  /**
   * Elimina un género del catálogo.
   *
   * Se rechaza con 409 mientras tenga álbumes asignados. Acá el chequeo no es una
   * cortesía como en artist.service.ts, sino la única protección que hay: la
   * relación con ALBUMS es N:M a través de genres_albums, y esa tabla intermedia
   * borra en cascada. Sin este corte, eliminar "Rock" se llevaría en silencio sus
   * vínculos y decenas de álbumes quedarían sin género.
   *
   * @param id_genre género a eliminar.
   */
  async remove(id_genre: number): Promise<void> {
    const genre = await findExisting(id_genre);

    // Cuentan todos los álbumes vinculados, sin mirar su estado de moderación:
    // el vínculo de uno pendiente se perdería igual que el de uno aprobado.
    const albums = genre.albums ?? [];
    if (albums.length > 0) {
      throw new ConflictError(buildDeleteConflictMessage(genre.name, albums));
    }

    await genreRepository.delete(genre);
  },
};
