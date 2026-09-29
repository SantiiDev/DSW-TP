// Servicio del CRUD de anuncios: centraliza las llamadas HTTP de /api/ads y mapea
// la respuesta cruda del backend al modelo Ad.
import { httpClient } from '../../../core/services/httpClient';
import { Ad } from '../models/Ad';
import type { AdApiResponse } from '../models/Ad';

/**
 * Campos que acepta el alta y la edición de un anuncio.
 *
 * `active` es opcional y el formulario no lo manda nunca: en un alta el backend
 * lo pone en true, y en una edición no mandarlo deja el anuncio como estaba. El
 * único que lo toca es el interruptor de la tabla, que manda ese campo solo.
 */
export type AdInput = {
  title: string;
  description: string | null;
  url_image: string;
  target_url: string | null;
  active?: boolean;
};

/**
 * Pasa un anuncio del JSON de la API al modelo.
 * @param data anuncio crudo tal como lo devuelve el backend.
 */
function toAd(data: AdApiResponse): Ad {
  return new Ad(
    data.id_ad,
    data.title,
    data.description,
    data.url_image,
    data.target_url,
    data.active
  );
}

export const adService = {
  /**
   * Los anuncios en circulación: es lo que consume el panel lateral.
   * Pide sesión, porque los anuncios se le muestran solo a un usuario logueado.
   */
  async listActive(): Promise<Ad[]> {
    const data = await httpClient.get<AdApiResponse[]>('/ads/active');
    return data.map(toAd);
  },

  /** Todos los anuncios, activos e inactivos. El backend lo restringe a ADMIN. */
  async list(): Promise<Ad[]> {
    const data = await httpClient.get<AdApiResponse[]>('/ads');
    return data.map(toAd);
  },

  /** Da de alta un anuncio. El backend lo restringe a ADMIN. */
  async create(input: AdInput): Promise<Ad> {
    const data = await httpClient.post<AdApiResponse>('/ads', input);
    return toAd(data);
  },

  /**
   * Modifica un anuncio. El backend lo restringe a ADMIN.
   * Acepta un cambio parcial: el interruptor de la tabla manda solo `active`.
   */
  async update(id: number, input: Partial<AdInput>): Promise<Ad> {
    const data = await httpClient.patch<AdApiResponse>(`/ads/${id}`, input);
    return toAd(data);
  },

  /** Elimina un anuncio. El backend lo restringe a ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/ads/${id}`);
  },
};
