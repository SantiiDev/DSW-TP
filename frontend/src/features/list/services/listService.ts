// Servicio del CRUD de listas personalizadas: centraliza las llamadas HTTP de
// /api/lists y mapea la respuesta cruda del backend a los modelos de List.ts.
import { httpClient } from '../../../core/services/httpClient';
import { List, ListItem, ListItemArtist, ListUser } from '../models/List';
import type { ListApiResponse, ListItemApiResponse, ListType } from '../models/List';

/**
 * Campos que acepta el alta y la edición de una lista.
 *
 * `type` y `itemIds` solo viajan en el ALTA, y los ítems con al menos un
 * elemento: el backend rechaza una lista vacía. La edición cambia nombre y
 * descripción; los ítems de una lista ya creada se agregan y se sacan de a uno,
 * con `addItem`/`removeItem`, y el tipo no se puede cambiar nunca.
 */
export type ListInput = {
  name: string;
  /** String vacío para dejarla sin descripción: el backend lo guarda como NULL. */
  description?: string;
  type?: ListType;
  /** Ids de álbum o de canción, según el `type` elegido. */
  itemIds?: number[];
};

/** Cómo ordenar el explorador: "top" es cantidad de "me gusta", "recent" las más nuevas. */
export type ListSort = 'recent' | 'top';

/** Filtros del explorador. Sin ninguno, trae las listas más nuevas primero. */
export type ListFilters = {
  /** Deja solo las listas con al menos un ítem de este género. */
  genre?: number;
  /** Búsqueda parcial por nombre. */
  q?: string;
  idUser?: number;
  /** Solo listas de álbumes o solo de canciones. Sin esto, vienen las dos. */
  type?: ListType;
  sort?: ListSort;
  limit?: number;
  offset?: number;
};

/**
 * Pasa un ítem de una lista del JSON de la API al modelo.
 * @param data ítem crudo tal como lo devuelve el backend.
 */
function toListItem(data: ListItemApiResponse): ListItem {
  return new ListItem(
    data.kind,
    data.id,
    data.title,
    data.url_cover,
    data.release_year,
    data.artist ? new ListItemArtist(data.artist.id_artist, data.artist.name) : null,
    data.id_album,
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
    data.type,
    new Date(data.creation_date),
    data.user ? new ListUser(data.user.id_user, data.user.username, data.user.url_avatar) : null,
    data.items_count,
    data.likes_count,
    data.liked_by_me,
    data.covers,
    (data.items ?? []).map(toListItem)
  );
}

/**
 * Arma el query string del explorador salteando los filtros vacíos.
 * @param filters género, texto, autor, tipo, orden y paginado.
 */
function buildQuery(filters: ListFilters): string {
  const params = new URLSearchParams();
  if (filters.genre !== undefined) params.set('genre', String(filters.genre));
  if (filters.q) params.set('q', filters.q);
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.idUser !== undefined) params.set('id_user', String(filters.idUser));
  if (filters.type) params.set('type', filters.type);
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

  /** Trae el detalle de una lista, con sus ítems en orden. */
  async getById(id: number): Promise<List> {
    const data = await httpClient.get<ListApiResponse>(`/lists/${id}`);
    return toList(data);
  },

  /**
   * Crea una lista de álbumes o de canciones con sus ítems. El backend la
   * restringe a PRO y ADMIN, y exige al menos un ítem.
   */
  async create(input: ListInput): Promise<List> {
    // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
    const data = await httpClient.post<ListApiResponse>('/lists', {
      name: input.name,
      description: input.description,
      type: input.type,
      item_ids: input.itemIds ?? [],
    });
    return toList(data);
  },

  /**
   * Edita el nombre o la descripción de una lista. Solo su dueño.
   * Los ítems no se tocan por acá: para eso están addItem y removeItem.
   */
  async update(id: number, input: Pick<ListInput, 'name' | 'description'>): Promise<List> {
    const data = await httpClient.patch<ListApiResponse>(`/lists/${id}`, input);
    return toList(data);
  },

  /** Elimina una lista. Su dueño, o un ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/lists/${id}`);
  },

  /**
   * Agrega un ítem a una lista. Solo su dueño.
   *
   * No hace falta decir si es un álbum o una canción: lo sabe la lista por su
   * `type`, y por eso la ruta es /items y no /albums o /songs.
   */
  async addItem(id: number, itemId: number): Promise<List> {
    const data = await httpClient.post<ListApiResponse>(`/lists/${id}/items`, {
      id_item: itemId,
    });
    return toList(data);
  },

  /** Saca un ítem de una lista. Solo su dueño. */
  async removeItem(id: number, itemId: number): Promise<List> {
    const data = await httpClient.delete<ListApiResponse>(`/lists/${id}/items/${itemId}`);
    return toList(data);
  },

  /** Pone o saca el "me gusta" sobre una lista. Es un interruptor, como en las reseñas. */
  async toggleLike(id: number): Promise<List> {
    const data = await httpClient.post<ListApiResponse>(`/lists/${id}/like`);
    return toList(data);
  },
};
