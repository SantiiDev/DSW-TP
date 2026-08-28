// Servicio del CRUD de canciones: centraliza las llamadas HTTP de /api/songs y
// mapea la respuesta cruda del backend al modelo Song.
import { httpClient } from '../../../core/services/httpClient';
import { Song, SongAlbum, SongArtist, SongCreator } from '../models/Song';
import type { ContentState, SongApiResponse, SongSort } from '../models/Song';

/** Campos que acepta el alta y la edición de una canción. */
export type SongInput = {
  song_title: string;
  /**
   * String vacío para que lo decida el backend: le asigna la pista siguiente a la
   * última del álbum, o la 1 si la canción no pertenece a ninguno.
   */
  number_track?: string;
  /** Duración en segundos. String vacío para dejarla sin dato. */
  duration?: string;
  /**
   * Álbum al que pertenece. Es obligatorio: la API no acepta canciones sueltas,
   * porque sin álbum la canción queda sin artista (ver song.schema.ts en el
   * backend).
   */
  id_album: number;
};

/** Filtros del listado. Sin ninguno, trae todas las canciones aprobadas. */
export type SongFilters = {
  /** El backend solo lo tiene en cuenta si quien pide es ADMIN o es su propio aporte. */
  state?: ContentState;
  /** Búsqueda parcial por título. */
  title?: string;
  /** Solo las pistas de un álbum: es el tracklist completo. */
  idAlbum?: number;
  /**
   * true deja solo las canciones propuestas por usuarios y false solo las del
   * catálogo inicial.
   */
  contributed?: boolean;
  /**
   * Deja solo los aportes de ese usuario. Lo usa la pestaña "Aportes" del perfil:
   * sobre los propios el backend devuelve también los pendientes y rechazados.
   */
  createdBy?: number;
};

/**
 * Pasa una canción del JSON de la API al modelo.
 * @param data canción cruda tal como la devuelve el backend.
 */
function toSong(data: SongApiResponse): Song {
  return new Song(
    data.id_song,
    data.number_track,
    data.song_title,
    data.duration,
    data.state,
    data.created_by,
    data.album
      ? new SongAlbum(
          data.album.id_album,
          data.album.title,
          data.album.release_year ?? null,
          data.album.url_cover ?? null,
          data.album.artist
            ? new SongArtist(data.album.artist.id_artist, data.album.artist.name)
            : null
        )
      : null,
    Number(data.average_rating),
    data.reviews_count,
    data.creator ? new SongCreator(data.creator.id_user, data.creator.username) : null
  );
}

/**
 * Arma el query string del listado salteando los filtros vacíos.
 * @param filters estado, título, álbum, origen y/o autor a buscar.
 * @returns algo como '?id_album=37&state=pending', o '' si no hay filtros.
 */
function buildQuery(filters: SongFilters): string {
  const params = new URLSearchParams();
  if (filters.state) params.set('state', filters.state);
  if (filters.title) params.set('title', filters.title);
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.idAlbum !== undefined) params.set('id_album', String(filters.idAlbum));
  // Se compara contra undefined y no con un if a secas: `false` es un filtro
  // válido (solo el catálogo inicial) y un if lo saltearía.
  if (filters.contributed !== undefined) params.set('contributed', String(filters.contributed));
  if (filters.createdBy !== undefined) params.set('created_by', String(filters.createdBy));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

/**
 * Filtros del explorador público. No tiene `state` ni `createdBy`: siempre
 * devuelve el catálogo aprobado, sin importar quién pregunte.
 */
export type SongExploreFilters = {
  /** Criterio de orden. Es lo que distingue una sección de /music de otra. */
  sort?: SongSort;
  /** Tope de filas. Las secciones piden 5 o 6; el listado pide una tanda. */
  limit?: number;
  /** Desde qué fila arranca. Junto con el tope es el paginado del listado. */
  offset?: number;
  /** Rango de años del ÁLBUM, los dos incluidos. Es lo que arma una década. */
  yearFrom?: number;
  yearTo?: number;
};

/**
 * Arma el query string del explorador salteando los filtros vacíos.
 * @param filters orden, tope y rango de años.
 */
function buildExploreQuery(filters: SongExploreFilters): string {
  const params = new URLSearchParams();
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.yearFrom !== undefined) params.set('year_from', String(filters.yearFrom));
  if (filters.yearTo !== undefined) params.set('year_to', String(filters.yearTo));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const songService = {
  /**
   * Listado del explorador: el catálogo aprobado, ordenado por el criterio que se
   * pida y acotado a un tope de filas.
   *
   * No pide sesión, a diferencia de `list()`: es lo que alimenta las secciones de
   * /music y la página de listado, que se ven sin iniciar sesión.
   */
  async explore(filters: SongExploreFilters = {}): Promise<Song[]> {
    const data = await httpClient.get<SongApiResponse[]>(
      `/songs/explore${buildExploreQuery(filters)}`
    );
    return data.map(toSong);
  },

  /** Lista las canciones del catálogo, opcionalmente filtradas. */
  async list(filters: SongFilters = {}): Promise<Song[]> {
    const data = await httpClient.get<SongApiResponse[]>(`/songs${buildQuery(filters)}`);
    return data.map(toSong);
  },

  /**
   * Trae la ficha de una canción, con su álbum y el artista de ese álbum.
   *
   * Es la única llamada de esta feature que funciona sin sesión: se llega a la
   * ficha desde el tracklist de /albums/:id, que es una página pública. Por eso
   * la API devuelve acá solo canciones aprobadas.
   */
  async getById(id: number): Promise<Song> {
    const data = await httpClient.get<SongApiResponse>(`/songs/${id}`);
    return toSong(data);
  },

  /**
   * Da de alta una canción. El backend lo restringe a PRO y ADMIN, y decide su
   * estado: aprobada si la carga un ADMIN, pendiente si la carga un PRO.
   */
  async create(input: SongInput): Promise<Song> {
    const data = await httpClient.post<SongApiResponse>('/songs', input);
    return toSong(data);
  },

  /** Actualiza los datos de la canción. Solo lo permite al ADMIN o a quien la cargó. */
  async update(id: number, input: Partial<SongInput>): Promise<Song> {
    const data = await httpClient.patch<SongApiResponse>(`/songs/${id}`, input);
    return toSong(data);
  },

  /** Elimina una canción. El backend lo restringe a ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/songs/${id}`);
  },

  /** Aprueba un aporte pendiente: pasa a verse en el catálogo público. */
  async approve(id: number): Promise<Song> {
    const data = await httpClient.patch<SongApiResponse>(`/songs/${id}/approve`);
    return toSong(data);
  },

  /** Rechaza un aporte pendiente: deja de verse, pero no se borra. */
  async reject(id: number): Promise<Song> {
    const data = await httpClient.patch<SongApiResponse>(`/songs/${id}/reject`);
    return toSong(data);
  },
};
