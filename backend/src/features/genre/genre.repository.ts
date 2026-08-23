// Acceso a datos de la feature genre: consultas a la tabla genres para el CRUD
// del catálogo. Es la única capa que habla con Sequelize.
import { Op } from 'sequelize';
import { Album, Genre } from '../../entities';
import { ContentState } from '../../shared/types/enums';

/** Álbum reducido a lo mínimo que hace falta para mostrar la ficha de un género. */
export type GenreAlbum = {
  id_album: number;
  title: string;
  /** Se trae para poder mostrar solo los aprobados sin una consulta aparte. */
  state: ContentState;
};

/** Género reducido a lo que hace falta para comparar nombres entre sí. */
export type GenreNameRow = {
  id_genre: number;
  name: string;
};

/**
 * Género tal como sale de este repositorio: con los álbumes que lo tienen
 * asignado, cuando la consulta los trajo (todas menos el alta, que crea un
 * género todavía sin nada colgado).
 *
 * `albums` no está declarada en genre.entity.ts porque las entidades son
 * compartidas por todas las features y no se tocan desde una sola. Se la agrega
 * acá, que es la capa que sabe cómo está armada la consulta.
 */
export type GenreWithAlbums = Genre & {
  albums?: GenreAlbum[];
};

/** Filtros opcionales del listado. Sin ninguno, devuelve los géneros completos. */
type GenreFilters = {
  /** Búsqueda parcial: alcanza con que el nombre contenga este texto. */
  name?: string;
};

type GenreData = {
  name: string;
};

// Los álbumes viajan con cada género por dos motivos: la grilla pública muestra
// cuántos tiene cada uno, y la baja necesita saber cuáles lo están bloqueando.
//
// through: { attributes: [] } deja afuera las columnas de la tabla intermedia
// (genres_albums): no las usa nadie y solo ensucian la respuesta.
const albumsInclude = {
  model: Album,
  as: 'albums',
  attributes: ['id_album', 'title', 'state'],
  through: { attributes: [] },
};

/**
 * Arma la cláusula where del listado a partir de los filtros recibidos.
 * @param filters nombre a filtrar.
 * @returns el where listo para Sequelize; vacío si no vino ningún filtro.
 */
function buildWhere(filters: GenreFilters) {
  // La colación de la base (utf8mb4_unicode_ci) ya ignora mayúsculas y
  // minúsculas, así que un LIKE común encuentra "Rock" buscando "rock".
  return filters.name ? { name: { [Op.like]: `%${filters.name}%` } } : {};
}

export const genreRepository = {
  findAll: async (filters: GenreFilters = {}): Promise<GenreWithAlbums[]> => {
    const genres = await Genre.findAll({
      where: buildWhere(filters),
      include: [albumsInclude],
      order: [['name', 'ASC']],
    });

    return genres as GenreWithAlbums[];
  },

  findById: async (id_genre: number): Promise<GenreWithAlbums | null> => {
    const genre = await Genre.findByPk(id_genre, {
      include: [albumsInclude],
    });

    return genre as GenreWithAlbums | null;
  },

  // Nombres de todos los géneros, sin includes: es lo único que necesita la
  // comparación contra nombres repetidos. Son once filas de dos columnas, así que
  // traerlas enteras sale más barato que una consulta por cada forma posible de
  // escribir el mismo nombre.
  findAllNames: (): Promise<GenreNameRow[]> =>
    Genre.findAll({
      attributes: ['id_genre', 'name'],
      order: [['name', 'ASC']],
    }),

  create: (data: GenreData): Promise<GenreWithAlbums> => Genre.create(data),

  update: async (genre: GenreWithAlbums, data: GenreData): Promise<GenreWithAlbums> => {
    // update() devuelve la misma instancia, así que conserva lo que ya había
    // traído el include.
    await genre.update(data);
    return genre;
  },

  delete: (genre: GenreWithAlbums): Promise<void> => genre.destroy(),
};
