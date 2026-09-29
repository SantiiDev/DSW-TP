// Lógica de negocio del CRUD de anuncios: alta, listado, edición y baja.
// No conoce req ni res; recibe datos ya validados y lanza errores de negocio que
// traduce el errorHandler.
//
// Es el service más chico del proyecto y a propósito: un anuncio no tiene dueño,
// no tiene circuito de moderación y no lo bloquea ninguna clave foránea. Toda la
// escritura es de ADMIN y eso ya lo corta requireRole en las rutas, igual que en
// genre.service.ts, así que acá no queda ningún chequeo de acceso.
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { Ad } from '../../entities';
import { adRepository } from './ad.repository';
import { CreateAdInput, UpdateAdInput } from './ad.schema';

/**
 * Vista pública de un anuncio. Es la misma para las dos lecturas: no hay nada
 * sensible que esconderle a un FREE, porque un anuncio está hecho justamente para
 * que lo vea.
 */
type PublicAd = {
  id_ad: number;
  title: string;
  description: string | null;
  url_image: string;
  target_url: string | null;
  active: boolean;
};

/**
 * Arma la vista pública de un anuncio.
 * @param ad anuncio tal como sale de la base.
 */
function toPublicAd(ad: Ad): PublicAd {
  return {
    id_ad: ad.id_ad,
    title: ad.title,
    description: ad.description,
    url_image: ad.url_image,
    target_url: ad.target_url,
    active: ad.active,
  };
}

/**
 * Busca el anuncio por id o corta con 404 si no existe.
 * La usan todas las operaciones que reciben un :id en la URL.
 */
async function findExisting(id_ad: number): Promise<Ad> {
  const ad = await adRepository.findById(id_ad);
  if (!ad) throw new NotFoundError('El anuncio');
  return ad;
}

/**
 * Corta con 409 si ya hay otro anuncio con ese título.
 *
 * El título tiene un índice único en la base (es lo que hace idempotente al
 * seed), así que sin este chequeo el choque lo tiraría MySQL y llegaría como un
 * 500 con un mensaje que no le sirve a nadie.
 *
 * @param title título a verificar, ya validado por Zod.
 * @param excludeId en una edición, el id del propio anuncio: que su título
 *   coincida consigo mismo no es un conflicto.
 */
async function assertTitleAvailable(title: string, excludeId?: number): Promise<void> {
  const existing = await adRepository.findByTitle(title);

  if (existing && existing.id_ad !== excludeId) {
    throw new ConflictError(`Ya hay un anuncio titulado "${title}".`);
  }
}

export const adService = {
  /** Todos los anuncios, activos e inactivos. Solo ADMIN (lo corta la ruta). */
  async list(): Promise<PublicAd[]> {
    const ads = await adRepository.findAll();
    return ads.map(toPublicAd);
  },

  /**
   * Los anuncios en circulación: es lo que pide el panel lateral del frontend.
   *
   * Quién los ve (solo un FREE) no se decide acá sino en el frontend, y no es un
   * descuido: el rol viaja en el token y este endpoint ya exige sesión, pero un
   * anuncio no es información protegida. Si un PRO pidiera la lista a mano no
   * obtendría nada que no pueda ver igual entrando al sitio sin cuenta.
   */
  async listActive(): Promise<PublicAd[]> {
    const ads = await adRepository.findAllActive();
    return ads.map(toPublicAd);
  },

  /**
   * Da de alta un anuncio.
   * @param data campos ya validados por Zod.
   */
  async create(data: CreateAdInput): Promise<PublicAd> {
    await assertTitleAvailable(data.title);

    const ad = await adRepository.create({
      title: data.title,
      description: data.description ?? null,
      url_image: data.url_image,
      target_url: data.target_url ?? null,
      active: data.active ?? true,
    });

    return toPublicAd(ad);
  },

  /**
   * Modifica un anuncio. Los campos que no vengan quedan como estaban: por eso se
   * arma el objeto salteando los `undefined` en vez de pasarle `data` entero al
   * repositorio, que escribiría null sobre lo que ya había.
   *
   * @param id_ad anuncio a modificar.
   * @param data campos a cambiar, al menos uno (lo exige el schema).
   */
  async update(id_ad: number, data: UpdateAdInput): Promise<PublicAd> {
    const ad = await findExisting(id_ad);

    // Renombrar también puede chocar con otro anuncio, así que se chequea igual
    // que en el alta.
    if (data.title !== undefined) await assertTitleAvailable(data.title, id_ad);

    const updated = await adRepository.update(ad, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.url_image !== undefined && { url_image: data.url_image }),
      ...(data.target_url !== undefined && { target_url: data.target_url }),
      ...(data.active !== undefined && { active: data.active }),
    });

    return toPublicAd(updated);
  },

  /**
   * Elimina un anuncio.
   *
   * No hay nada que lo bloquee: ninguna tabla apunta a ads, así que a diferencia
   * de un género o un plan, la baja no puede chocar con un 409.
   *
   * @param id_ad anuncio a eliminar.
   */
  async remove(id_ad: number): Promise<void> {
    const ad = await findExisting(id_ad);
    await adRepository.delete(ad);
  },
};

// Se exporta para que el controller pueda tipar lo que devuelve.
export type { PublicAd };
