// Servicio del CRUD de artistas: centraliza las llamadas HTTP de /api/artists y
// mapea la respuesta cruda del backend al modelo Artist.
import { httpClient } from '../../../core/services/httpClient';
import { Artist, ArtistAlbum, ArtistCreator } from '../models/Artist';
import type { ArtistApiResponse, ContentState, SimilarArtist } from '../models/Artist';

/** Campos que acepta el alta y la edición de un artista. */
export type ArtistInput = {
  name: string;
  /** String vacío para dejarlo sin biografía: el backend lo guarda como NULL. */
  biography?: string;
};

/** Filtros del listado. Sin ninguno, trae el catálogo aprobado completo. */
export type ArtistFilters = {
  /** El backend solo lo tiene en cuenta si quien pide es ADMIN. */
  state?: ContentState;
  /** Búsqueda parcial por nombre. */
  name?: string;
  /**
   * true deja solo los artistas propuestos por usuarios y false solo los del
   * catálogo inicial. Lo usa la cola de solicitudes, que muestra únicamente
   * aportes de la comunidad.
   */
  contributed?: boolean;
  /**
   * Deja solo los aportes de ese usuario. Lo usa la pestaña "Aportes" del perfil:
   * sobre los propios el backend devuelve también los pendientes y rechazados.
   */
  createdBy?: number;
};

/**
 * Pasa un artista del JSON de la API al modelo.
 * @param data artista crudo tal como lo devuelve el backend.
 */
function toArtist(data: ArtistApiResponse): Artist {
  return new Artist(
    data.id_artist,
    data.name,
    data.biography,
    data.state,
    data.created_by,
    (data.albums ?? []).map((album) => new ArtistAlbum(album.id_album, album.title)),
    data.creator ? new ArtistCreator(data.creator.id_user, data.creator.username) : null
  );
}

/**
 * Arma el query string del listado salteando los filtros vacíos.
 * @param filters estado y/o nombre a buscar.
 * @returns algo como '?state=pending&name=nirvana', o '' si no hay filtros.
 */
function buildQuery(filters: ArtistFilters): string {
  const params = new URLSearchParams();
  if (filters.state) params.set('state', filters.state);
  if (filters.name) params.set('name', filters.name);
  // Se compara contra undefined y no con un if a secas: `false` es un filtro
  // válido (solo el catálogo inicial) y un if lo saltearía.
  if (filters.contributed !== undefined) params.set('contributed', String(filters.contributed));
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.createdBy !== undefined) params.set('created_by', String(filters.createdBy));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const artistService = {
  /** Lista el catálogo de artistas, opcionalmente filtrado por estado y/o nombre. */
  async list(filters: ArtistFilters = {}): Promise<Artist[]> {
    const data = await httpClient.get<ArtistApiResponse[]>(`/artists${buildQuery(filters)}`);
    return data.map(toArtist);
  },

  /**
   * Busca artistas con un nombre parecido al que se quiere cargar, para poder
   * preguntar antes de crear un duplicado escrito distinto ("2Pacs" / "2Pac").
   *
   * @param name nombre que se está por cargar.
   * @param excludeId en una edición, el artista que se está editando.
   */
  async findSimilar(name: string, excludeId?: number): Promise<SimilarArtist[]> {
    const params = new URLSearchParams({ name });
    if (excludeId !== undefined) params.set('exclude_id', String(excludeId));

    return httpClient.get<SimilarArtist[]>(`/artists/similar?${params.toString()}`);
  },

  /** Trae la ficha de un artista puntual, con sus álbumes. */
  async getById(id: number): Promise<Artist> {
    const data = await httpClient.get<ArtistApiResponse>(`/artists/${id}`);
    return toArtist(data);
  },

  /**
   * Da de alta un artista. El backend lo restringe a PRO y ADMIN, y decide su
   * estado: aprobado si lo carga un ADMIN, pendiente si lo carga un PRO.
   */
  async create(input: ArtistInput): Promise<Artist> {
    const data = await httpClient.post<ArtistApiResponse>('/artists', input);
    return toArtist(data);
  },

  /** Actualiza nombre y/o biografía. Solo lo permite al ADMIN o a quien lo cargó. */
  async update(id: number, input: ArtistInput): Promise<Artist> {
    const data = await httpClient.patch<ArtistApiResponse>(`/artists/${id}`, input);
    return toArtist(data);
  },

  /** Elimina un artista. El backend lo restringe a ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/artists/${id}`);
  },

  /** Aprueba un aporte pendiente: pasa a verse en el catálogo público. */
  async approve(id: number): Promise<Artist> {
    const data = await httpClient.patch<ArtistApiResponse>(`/artists/${id}/approve`);
    return toArtist(data);
  },

  /** Rechaza un aporte pendiente: deja de verse, pero no se borra. */
  async reject(id: number): Promise<Artist> {
    const data = await httpClient.patch<ArtistApiResponse>(`/artists/${id}/reject`);
    return toArtist(data);
  },
};
