// Servicio del CRUD de listas personalizadas: centraliza las llamadas HTTP de
// /api/lists y mapea la respuesta cruda del backend a los modelos de List.ts.
import { httpClient } from '../../../core/services/httpClient';
import { List, ListAlbum, ListAlbumArtist, ListUser } from '../models/List';
import type { ListAlbumApiResponse, ListApiResponse } from '../models/List';

/**
 * Campos que acepta el alta y la edición de una lista.
 *
 * `albumIds` solo viaja en el ALTA, y con al menos un elemento: el backend
 * rechaza una lista sin álbumes. La edición cambia nombre y descripción; los
 * álbumes de una lista ya creada se agregan y se sacan de a uno, con
 * `addAlbum`/`removeAlbum`.
 */
export type ListInput = {
  name: string;
  /** String vacío para dejarla sin descripción: el backend lo guarda como NULL. */
  description?: string;
  albumIds?: number[];
};

/** Cómo ordenar el explorador: "top" es cantidad de "me gusta", "recent" las más nuevas. */
export type ListSort = 'recent' | 'top';

/** Filtros del explorador. Sin ninguno, trae las listas más nuevas primero. */
export type ListFilters = {
  /** Deja solo las listas con al menos un álbum de este género. */
  genre?: number;
  /** Búsqueda parcial por nombre. */
  q?: string;
  idUser?: number;
  sort?: ListSort;
  limit?: number;
  offset?: number;
};

/**
 * Pasa un álbum de una lista del JSON de la API al modelo.
 * @param data álbum crudo tal como lo devuelve el backend.
 */
function toListAlbum(data: ListAlbumApiResponse): ListAlbum {
  return new ListAlbum(
    data.id_album,
    data.title,
    data.url_cover,
    data.release_year,
    data.artist ? new ListAlbumArtist(data.artist.id_artist, data.artist.name) : null,
    data.position
  );
}

/**
 * Pasa una lista del JSON de la API al modelo.
 * @param data lista cruda tal como la devuelve el backend.
 */
function toList(data: ListApiResponse): List {
  return new List(
    data.id_list,
    data.name,
    data.description,
    new Date(data.creation_date),
    data.user ? new ListUser(data.user.id_user, data.user.username, data.user.url_avatar) : null,
    data.albums_count,
    data.likes_count,
    data.liked_by_me,
    data.covers,
    (data.albums ?? []).map(toListAlbum)
  );
}

/**
 * Arma el query string del explorador salteando los filtros vacíos.
 * @param filters género, texto, autor, orden y paginado.
 */
function buildQuery(filters: ListFilters): string {
  const params = new URLSearchParams();
  if (filters.genre !== undefined) params.set('genre', String(filters.genre));
  if (filters.q) params.set('q', filters.q);
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.idUser !== undefined) params.set('id_user', String(filters.idUser));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const listService = {
  /** Explora listas, opcionalmente filtradas. No pide sesión: es la vitrina de /lists. */
  async list(filters: ListFilters = {}): Promise<List[]> {
    const data = await httpClient.get<ListApiResponse[]>(`/lists${buildQuery(filters)}`);
    return data.map(toList);
  },

  /** Las listas propias. Alimenta "Mis listas" y el modal de "Agregar a una lista". */
  async listMine(): Promise<List[]> {
    const data = await httpClient.get<ListApiResponse[]>('/lists/mine');
    return data.map(toList);
  },

  /** Trae el detalle de una lista, con sus álbumes en orden. */
  async getById(id: number): Promise<List> {
    const data = await httpClient.get<ListApiResponse>(`/lists/${id}`);
    return toList(data);
  },

  /**
   * Crea una lista con sus álbumes. Cualquier usuario registrado, igual que
   * publicar una reseña. El backend exige al menos un álbum.
   */
  async create(input: ListInput): Promise<List> {
    // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
    const data = await httpClient.post<ListApiResponse>('/lists', {
      name: input.name,
      description: input.description,
      album_ids: input.albumIds ?? [],
    });
    return toList(data);
  },

  /**
   * Edita el nombre o la descripción de una lista. Solo su dueño.
   * Los álbumes no se tocan por acá: para eso están addAlbum y removeAlbum.
   */
  async update(id: number, input: Pick<ListInput, 'name' | 'description'>): Promise<List> {
    const data = await httpClient.patch<ListApiResponse>(`/lists/${id}`, input);
    return toList(data);
  },

  /** Elimina una lista. Su dueño, o un ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/lists/${id}`);
  },

  /** Agrega un álbum a una lista. Solo su dueño. */
  async addAlbum(id: number, idAlbum: number): Promise<List> {
    const data = await httpClient.post<ListApiResponse>(`/lists/${id}/albums`, {
      id_album: idAlbum,
    });
    return toList(data);
  },

  /** Saca un álbum de una lista. Solo su dueño. */
  async removeAlbum(id: number, idAlbum: number): Promise<List> {
    const data = await httpClient.delete<ListApiResponse>(`/lists/${id}/albums/${idAlbum}`);
    return toList(data);
  },

  /** Pone o saca el "me gusta" sobre una lista. Es un interruptor, como en las reseñas. */
  async toggleLike(id: number): Promise<List> {
    const data = await httpClient.post<ListApiResponse>(`/lists/${id}/like`);
    return toList(data);
  },
};
