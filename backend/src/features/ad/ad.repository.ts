// Acceso a datos de la feature ad: consultas a la tabla ads.
// Es la única capa que habla con Sequelize.
import { Ad } from '../../entities';

/** Campos que se pueden escribir en un anuncio. Todos opcionales en la edición. */
export type AdData = {
  title?: string;
  description?: string | null;
  url_image?: string;
  target_url?: string | null;
  active?: boolean;
};

/** Lo mismo, pero con lo obligatorio del alta ya exigido. */
export type NewAdData = AdData & {
  title: string;
  url_image: string;
};

export const adRepository = {
  // Todos los anuncios, activos e inactivos. Es lo que lista el panel de
  // administración. Ordenados por id para que la tabla no se reordene sola al
  // editar uno.
  findAll: (): Promise<Ad[]> => Ad.findAll({ order: [['id_ad', 'ASC']] }),

  // Solo los que están en circulación: es lo que consume el panel lateral del
  // frontend. El orden por id es además el orden de la rotación, así que tiene que
  // ser estable entre una carga y la siguiente.
  findAllActive: (): Promise<Ad[]> =>
    Ad.findAll({ where: { active: true }, order: [['id_ad', 'ASC']] }),

  findById: (id_ad: number): Promise<Ad | null> => Ad.findByPk(id_ad),

  // Busca por título exacto. Es lo que usa el service para rechazar un repetido
  // con un 409 claro, en vez de dejar que reviente el índice único con un 500.
  findByTitle: (title: string): Promise<Ad | null> => Ad.findOne({ where: { title } }),

  create: (data: NewAdData): Promise<Ad> => Ad.create(data),

  update: async (ad: Ad, data: AdData): Promise<Ad> => {
    // update() devuelve la misma instancia ya actualizada.
    await ad.update(data);
    return ad;
  },

  delete: (ad: Ad): Promise<void> => ad.destroy(),
};
