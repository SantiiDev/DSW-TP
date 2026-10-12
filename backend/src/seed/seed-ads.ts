// Carga los cinco anuncios que se le muestran a un usuario FREE.
//
// Son ficticios y del rubro musical, para que se parezcan a la publicidad que
// tendría un sitio como este. Las imágenes NO viajan en la base: la columna
// guarda la ruta dentro de public/ del frontend, y los archivos van en
// frontend/public/images/ads/ con estos mismos nombres.
//
// Es idempotente, y además CORRIGE: el título es la clave natural (tiene el
// índice único de la tabla), así que un anuncio que ya está no se saltea, se
// actualiza con los valores de acá. Eso es lo que permite arreglar una ruta de
// imagen mal cargada volviendo a correr el seed, en vez de tener que editar la
// fila a mano.
//
// Uso:
//   npm run seed:ads             carga y corrige los cinco anuncios
//   npm run seed:ads -- --prune  además borra los anuncios que no son de esta
//                                lista (por ejemplo, restos de una prueba vieja)
import { Op } from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { Ad } from '../entities';

const ADS = [
  {
    title: 'Auriculares Sonar X',
    description: 'Cancelación de ruido y 40 horas de batería. Escuchá cada detalle.',
    url_image: '/images/ads/ads-auriculares.jpg',
    target_url: 'https://example.com/sonar-x',
  },
  {
    title: 'Vinilos Club',
    description: 'Un vinilo elegido a mano, en tu casa, todos los meses.',
    url_image: '/images/ads/ads-vinilos.jpg',
    target_url: 'https://example.com/vinilos-club',
  },
  {
    title: 'Festival Rosario Suena',
    description: 'Tres días, cuatro escenarios. Entradas a la venta.',
    url_image: '/images/ads/ads-festival.jpg',
    target_url: 'https://example.com/rosario-suena',
  },
  {
    title: 'Giradiscos Aurora 3',
    description: 'Bandeja de tracción por correa y cápsula incluida. Soná como en el 78.',
    url_image: '/images/ads/ads-giradiscos.jpg',
    target_url: 'https://example.com/aurora-3',
  },
  // El quinto no vende un producto de afuera: Musicboxd se publicita a sí mismo.
  // Es la vuelta de tuerca del sistema, porque el anuncio que más le conviene
  // mostrarle a un FREE es justamente el que lo saca de ver anuncios. Por eso su
  // enlace es interno y va a la página de venta de la membresía.
  {
    title: 'Musicboxd Pro',
    description: 'Estadísticas, listas propias y cero publicidad. Un pago y listo.',
    url_image: '/images/ads/ads-musica.jpg',
    target_url: '/pro',
  },
];

/**
 * Deja los cinco anuncios de la lista tal como están escritos acá: crea los que
 * faltan y actualiza los que ya estaban.
 *
 * No abre ni cierra la conexión: de eso se encarga quien la llama, así este seed
 * se puede encadenar con otros dentro de run-seeds y de db:reset.
 *
 * Al final avisa si quedó en la tabla algún anuncio ajeno a esta lista, porque es
 * lo que hace que aparezcan anuncios con la imagen rota: una fila vieja apuntando
 * a un archivo que ya no existe en public/images/ads/.
 */
export async function seedAds(): Promise<void> {
  for (const ad of ADS) {
    // El título es la clave natural (índice único `ads_title_unique`).
    const existing = await Ad.findOne({ where: { title: ad.title } });

    if (existing) {
      // Se actualiza en vez de saltear: si cambió el nombre del archivo de la
      // imagen o el texto, el seed tiene que poder corregirlo.
      await existing.update(ad);
      console.log(`[seed] Anuncio actualizado: ${ad.title}`);
    } else {
      await Ad.create(ad);
      console.log(`[seed] Anuncio creado: ${ad.title}`);
    }
  }

  const seededTitles = ADS.map((ad) => ad.title);
  const strays = await Ad.findAll({
    where: { title: { [Op.notIn]: seededTitles } },
    attributes: ['id_ad', 'title', 'url_image'],
  });

  if (strays.length > 0) {
    console.warn(
      `\n[seed] ATENCIÓN: hay ${strays.length} anuncio(s) en la base que no son de este seed:`
    );
    for (const stray of strays) {
      console.warn(`  #${stray.id_ad}  ${stray.title}  ->  ${stray.url_image}`);
    }
    console.warn(
      '[seed] Si su imagen no existe, se van a ver como anuncios sin foto.\n' +
        '[seed] Para borrarlos: npm run seed:ads -- --prune\n'
    );
  }
}

/**
 * Borra los anuncios que NO están en la lista de este archivo.
 *
 * Es destructivo y por eso va detrás de un flag explícito: también se llevaría un
 * anuncio que un ADMIN haya cargado a mano desde el panel. Sirve para limpiar los
 * restos de una prueba anterior.
 */
export async function pruneStrayAds(): Promise<void> {
  const seededTitles = ADS.map((ad) => ad.title);
  const removed = await Ad.destroy({ where: { title: { [Op.notIn]: seededTitles } } });

  console.log(
    removed === 0
      ? '[seed] No había anuncios ajenos al seed: no se borró nada.'
      : `[seed] Borrados ${removed} anuncio(s) que no son de este seed.`
  );
}

// Permite correr este seed solo, con `npm run seed:ads`, y con `-- --prune` para
// limpiar además los anuncios ajenos a la lista.
if (require.main === module) {
  void (async () => {
    const prune = process.argv.includes('--prune');
    try {
      await sequelize.authenticate();
      console.log('[seed] Conectado a la base de datos.');
      await seedAds();
      if (prune) await pruneStrayAds();
      console.log('[seed] Listo.');
      await sequelize.close();
    } catch (error) {
      console.error('[seed] Falló la carga de anuncios:');
      console.error(error);
      process.exit(1);
    }
  })();
}
