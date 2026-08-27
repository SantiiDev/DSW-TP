// Servicio del CRUD de álbumes: centraliza las llamadas HTTP de /api/albums y
// mapea la respuesta cruda del backend al modelo Album.
import { httpClient } from '../../../core/services/httpClient';
import { Album, AlbumArtist, AlbumCreator, AlbumGenre, AlbumSong } from '../models/Album';
import type { AlbumApiResponse, ContentState } from '../models/Album';

/** Campos que acepta el alta y la edición de un álbum. */
export type AlbumInput = {
  title: string;
  /** String vacío para dejarlo sin año: el backend lo guarda como NULL. */
  release_year?: string;
  /** String vacío para dejarlo sin portada: el backend lo guarda como NULL. */
  url_cover?: string;
  id_artist: number;
  /**
   * Géneros del álbum. REEMPLAZA la lista entera, así que mandar [] le saca
   * todos. Si no se manda, el backend deja los que ya tenía.
   */
  genre_ids?: number[];
};

/** Filtros del listado. Sin ninguno, trae el catálogo aprobado completo. */
export type AlbumFilters = {
  /** El backend solo lo tiene en cuenta si quien pide es ADMIN o es su propio aporte. */
  state?: ContentState;
  /** Búsqueda parcial por título. */
  title?: string;
  /** Solo los álbumes de un artista. */
  idArtist?: number;
  /**
   * true deja solo los álbumes propuestos por usuarios y false solo los del
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
 * Pasa un álbum del JSON de la API al modelo.
 * @param data álbum crudo tal como lo devuelve el backend.
 */
function toAlbum(data: AlbumApiResponse): Album {
  return new Album(
    data.id_album,
    data.title,
    data.release_year,
    data.url_cover,
    Number(data.average_rating),
    data.state,
    data.created_by,
    data.artist ? new AlbumArtist(data.artist.id_artist, data.artist.name) : null,
    (data.genres ?? []).map((genre) => new AlbumGenre(genre.id_genre, genre.name)),
    data.songs_count,
    data.reviews_count,
    // El listado no manda el tracklist: ahí el álbum queda con la lista vacía y
    // solo con songs_count.
    (data.songs ?? []).map(
      (song) =>
        new AlbumSong(
          song.id_song,
          song.number_track,
          song.song_title,
          song.duration,
          song.state,
          Number(song.average_rating),
          song.reviews_count
        )
    ),
    data.creator ? new AlbumCreator(data.creator.id_user, data.creator.username) : null
  );
}

/**
 * Arma el query string del listado salteando los filtros vacíos.
 * @param filters estado, título, artista, origen y/o autor a buscar.
 * @returns algo como '?state=pending&title=nevermind', o '' si no hay filtros.
 */
function buildQuery(filters: AlbumFilters): string {
  const params = new URLSearchParams();
  if (filters.state) params.set('state', filters.state);
  if (filters.title) params.set('title', filters.title);
  // La API usa los nombres del DER, así que acá se traduce el camelCase del front.
  if (filters.idArtist !== undefined) params.set('id_artist', String(filters.idArtist));
  // Se compara contra undefined y no con un if a secas: `false` es un filtro
  // válido (solo el catálogo inicial) y un if lo saltearía.
  if (filters.contributed !== undefined) params.set('contributed', String(filters.contributed));
  if (filters.createdBy !== undefined) params.set('created_by', String(filters.createdBy));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const albumService = {
  /** Lista el catálogo de álbumes, opcionalmente filtrado. */
  async list(filters: AlbumFilters = {}): Promise<Album[]> {
    const data = await httpClient.get<AlbumApiResponse[]>(`/albums${buildQuery(filters)}`);
    return data.map(toAlbum);
  },

  /**
   * Trae la ficha de un álbum, con su tracklist.
   *
   * Es la única llamada de esta feature que funciona sin sesión: se llega a la
   * ficha desde la página del género, que es pública. Por eso la API devuelve acá
   * solo álbumes aprobados (y solo sus pistas aprobadas).
   */
  async getById(id: number): Promise<Album> {
    const data = await httpClient.get<AlbumApiResponse>(`/albums/${id}`);
    return toAlbum(data);
  },

  /**
   * Da de alta un álbum. El backend lo restringe a PRO y ADMIN, y decide su
   * estado: aprobado si lo carga un ADMIN, pendiente si lo carga un PRO.
   */
  async create(input: AlbumInput): Promise<Album> {
    const data = await httpClient.post<AlbumApiResponse>('/albums', input);
    return toAlbum(data);
  },

  /** Actualiza los datos del álbum. Solo lo permite al ADMIN o a quien lo cargó. */
  async update(id: number, input: Partial<AlbumInput>): Promise<Album> {
    const data = await httpClient.patch<AlbumApiResponse>(`/albums/${id}`, input);
    return toAlbum(data);
  },

  /** Elimina un álbum. El backend lo restringe a ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/albums/${id}`);
  },

  /** Aprueba un aporte pendiente: pasa a verse en el catálogo público. */
  async approve(id: number): Promise<Album> {
    const data = await httpClient.patch<AlbumApiResponse>(`/albums/${id}/approve`);
    return toAlbum(data);
  },

  /** Rechaza un aporte pendiente: deja de verse, pero no se borra. */
  async reject(id: number): Promise<Album> {
    const data = await httpClient.patch<AlbumApiResponse>(`/albums/${id}/reject`);
    return toAlbum(data);
  },
};
