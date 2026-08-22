// Servicio del CRUD de géneros: centraliza las llamadas HTTP de /api/genres y
// mapea la respuesta cruda del backend al modelo Genre.
import { httpClient } from '../../../core/services/httpClient';
import { Genre, GenreAlbum } from '../models/Genre';
import type { GenreApiResponse } from '../models/Genre';

/** Campos que acepta el alta y la edición de un género. */
export type GenreInput = {
  name: string;
};

/** Filtros del listado. Sin ninguno, trae los géneros completos. */
export type GenreFilters = {
  /** Búsqueda parcial por nombre. */
  name?: string;
};

/**
 * Pasa un género del JSON de la API al modelo.
 * @param data género crudo tal como lo devuelve el backend.
 */
function toGenre(data: GenreApiResponse): Genre {
  return new Genre(
    data.id_genre,
    data.name,
    (data.albums ?? []).map((album) => new GenreAlbum(album.id_album, album.title, album.state))
  );
}

/**
 * Arma el query string del listado salteando los filtros vacíos.
 * @param filters nombre a buscar.
 * @returns algo como '?name=rock', o '' si no hay filtros.
 */
function buildQuery(filters: GenreFilters): string {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const genreService = {
  /** Lista los géneros del catálogo, opcionalmente filtrados por nombre. */
  async list(filters: GenreFilters = {}): Promise<Genre[]> {
    const data = await httpClient.get<GenreApiResponse[]>(`/genres${buildQuery(filters)}`);
    return data.map(toGenre);
  },

  /** Trae la ficha de un género puntual, con sus álbumes. */
  async getById(id: number): Promise<Genre> {
    const data = await httpClient.get<GenreApiResponse>(`/genres/${id}`);
    return toGenre(data);
  },

  /** Da de alta un género. El backend lo restringe a ADMIN. */
  async create(input: GenreInput): Promise<Genre> {
    const data = await httpClient.post<GenreApiResponse>('/genres', input);
    return toGenre(data);
  },

  /** Renombra un género. El backend lo restringe a ADMIN. */
  async update(id: number, input: GenreInput): Promise<Genre> {
    const data = await httpClient.patch<GenreApiResponse>(`/genres/${id}`, input);
    return toGenre(data);
  },

  /**
   * Elimina un género. El backend lo restringe a ADMIN y responde 409 si el
   * género todavía tiene álbumes asignados.
   */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/genres/${id}`);
  },
};
