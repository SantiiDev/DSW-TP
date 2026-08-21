// Descarga el catálogo inicial desde Deezer y lo deja en `seed/data/*.json`.
//
// ESTE SCRIPT SE CORRE UNA SOLA VEZ, A MANO, Y NO FORMA PARTE DE `npm run seed`.
// Los archivos que genera están versionados en git, así que para llenar la base
// alcanza con `npm run seed`: no hace falta internet ni volver a correr esto.
// Solo se vuelve a ejecutar si se quiere ampliar o rehacer la selección de
// `catalog-selection.ts`.
//
// Uso:  npm run seed:fetch
//
// Qué hace, para cada género de la curaduría:
//   1. resuelve cada artista por nombre con `/search/artist`
//   2. le pide su discografía con `/artist/{id}/albums`
//   3. se queda con sus mejores álbumes (ver `pickAlbums`)
//   4. baja el detalle de cada uno con `/album/{id}`, que trae géneros y tracklist
//
// Lo que se guarda son los campos de la respuesta de Deezer tal como vienen, sin
// transformarlos: se descartan solamente los que el seed no usa (miniaturas en cinco
// tamaños, previews en mp3, links a la web). La traducción al modelo de datos propio
// —años, números de pista, ids— ocurre después, en `seed-catalog.ts`.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ALBUMS_PER_ARTIST, ArtistSelection, CATALOG } from './catalog-selection';
import {
  DeezerAlbumSummary,
  DeezerArtist,
  getAlbum,
  getArtist,
  getArtistAlbums,
  searchArtist,
} from './deezer-client';

export const DATA_DIR = path.join(__dirname, 'data');

// --- Forma de los archivos que se generan ------------------------------------

export type RawGenre = {
  deezer_id: number | null;
  name: string;
};

export type RawArtist = {
  deezer_id: number;
  name: string;
  /** Géneros de la curaduría bajo los que se lo incluyó. */
  genres: string[];
};

export type RawTrack = {
  deezer_id: number;
  title: string;
  /** Duración en segundos, tal como la devuelve Deezer. */
  duration: number;
};

export type RawAlbum = {
  deezer_id: number;
  title: string;
  /** Fecha `YYYY-MM-DD` de la edición concreta que se descargó. */
  release_date: string;
  /**
   * La más antigua de las fechas de todas las ediciones del mismo disco que hay en
   * Deezer. Es de acá de donde el seed saca `albums.release_year` (ver `pickAlbums`).
   */
  original_release_date: string;
  cover_xl: string | null;
  artist_deezer_id: number;
  artist_name: string;
  genres: string[];
  /** En el orden en que Deezer los devuelve, que es el orden del disco. */
  tracks: RawTrack[];
};

// --- Utilidades ---------------------------------------------------------------

// Pasa un texto a minúsculas y sin acentos, para poder comparar nombres que se
// escriben distinto ("Ruben Blades" vs "Rubén Blades").
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

// Deja solo el título "base" de un álbum, sin los sufijos de reedición.
// Sirve para detectar que "Abbey Road (Remastered)" y "Abbey Road (2019 Mix)" son
// el mismo disco y quedarnos con uno solo.
function baseTitle(title: string): string {
  return normalize(
    title
      .replace(/\s*[([].*?[)\]]\s*/g, ' ')
      .replace(/\s*-\s*(remaster|remastered|deluxe|edition|version|reissue|anniversary).*$/i, '')
  ).replace(/\s+/g, ' ');
}

/**
 * Elige el resultado de búsqueda que corresponde al artista pedido.
 *
 * Deezer tiene páginas duplicadas para casi todos los artistas conocidos: además de la
 * oficial hay varias con el mismo nombre, un puñado de singles sueltos y casi ningún
 * seguidor. Y el buscador las devuelve primero. La diferencia entre una y otra es
 * abismal (la página real de Charly García tiene 198.798 seguidores; la que devuelve
 * primero el buscador, 6), así que entre los nombres que coinciden exacto se elige
 * la de más seguidores en lugar de la primera.
 */
function pickArtist(wanted: string, results: DeezerArtist[]): DeezerArtist | null {
  if (results.length === 0) return null;

  const byFans = [...results].sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0));
  const exact = byFans.filter((artist) => normalize(artist.name) === normalize(wanted));

  if (exact.length > 0) return exact[0];

  const fallback = byFans[0];
  console.log(`  [!] "${wanted}" no coincide exacto, se usa "${fallback.name}" (revisar)`);
  return fallback;
}

/** Devuelve el nombre de una entrada de la curaduría, fije o no su id de Deezer. */
function nameOf(selection: ArtistSelection): string {
  return typeof selection === 'string' ? selection : selection.name;
}

/**
 * Obtiene de Deezer el artista de una entrada de la curaduría.
 * Si la entrada fija un id lo pide directo; si no, lo busca por nombre.
 */
async function resolveArtist(selection: ArtistSelection): Promise<DeezerArtist | null> {
  if (typeof selection !== 'string') {
    return getArtist(selection.deezerId);
  }
  const search = await searchArtist(selection);
  return pickArtist(selection, search.data ?? []);
}

/** Un álbum elegido, junto con la fecha más antigua entre todas sus ediciones. */
type PickedAlbum = { album: DeezerAlbumSummary; originalReleaseDate: string };

/**
 * Se queda con los mejores álbumes de una discografía.
 *
 * Descarta singles, EPs y recopilatorios (`record_type !== 'album'`), unifica las
 * reediciones del mismo disco y ordena por cantidad de fans, que es el indicador de
 * relevancia que publica Deezer.
 *
 * Sobre la fecha: Deezer no expone la fecha de lanzamiento original de un disco, sino
 * la de cada edición que tiene cargada. Por eso "Clics Modernos", de 1983, figura como
 * 2007 (su reedición). Como el listado de álbumes se filtra por año, de cada grupo de
 * ediciones se guarda la fecha más antigua, que es la aproximación más cercana al
 * lanzamiento original que se puede obtener de esta API.
 */
function pickAlbums(albums: DeezerAlbumSummary[]): PickedAlbum[] {
  const bestByTitle = new Map<string, DeezerAlbumSummary>();
  const earliestByTitle = new Map<string, string>();

  for (const album of albums) {
    if (album.record_type !== 'album') continue;
    if (!album.release_date) continue;

    const key = baseTitle(album.title);

    const current = bestByTitle.get(key);
    // Entre dos ediciones del mismo disco gana la que más fans tiene: suele ser la
    // que tiene mejor portada y el tracklist completo.
    if (!current || (album.fans ?? 0) > (current.fans ?? 0)) {
      bestByTitle.set(key, album);
    }

    const earliest = earliestByTitle.get(key);
    // Las fechas vienen como `YYYY-MM-DD`, así que se comparan como texto sin más.
    if (!earliest || album.release_date < earliest) {
      earliestByTitle.set(key, album.release_date);
    }
  }

  return [...bestByTitle.entries()]
    .sort(([, a], [, b]) => (b.fans ?? 0) - (a.fans ?? 0))
    .slice(0, ALBUMS_PER_ARTIST)
    .map(([key, album]) => ({
      album,
      originalReleaseDate: earliestByTitle.get(key) ?? album.release_date,
    }));
}

// --- Descarga -----------------------------------------------------------------

async function fetchCatalog(): Promise<void> {
  const genres: RawGenre[] = CATALOG.map((g) => ({ deezer_id: g.deezerId, name: g.name }));

  // Un mismo artista puede estar en la curaduría de más de un género; se guarda una
  // sola vez y se le van sumando los géneros. Clave: id de Deezer.
  const artistsById = new Map<number, RawArtist>();
  const albumsById = new Map<number, RawAlbum>();

  // Traduce los ids de género de Deezer a los nombres de nuestra curaduría.
  const genreNameByDeezerId = new Map<number, string>();
  for (const genre of CATALOG) {
    if (genre.deezerId !== null) genreNameByDeezerId.set(genre.deezerId, genre.name);
  }

  for (const genre of CATALOG) {
    console.log(`\n[fetch] Género: ${genre.name} (${genre.artists.length} artistas)`);

    for (const selection of genre.artists) {
      const found = await resolveArtist(selection);

      if (!found) {
        console.log(`  [!] Sin resultados para "${nameOf(selection)}", se omite.`);
        continue;
      }

      const known = artistsById.get(found.id);
      if (known) {
        // Ya lo trajo otro género: solo se le suma este y no se vuelve a bajar su discografía.
        if (!known.genres.includes(genre.name)) known.genres.push(genre.name);
        console.log(`  ${found.name} — ya descargado, se le suma el género ${genre.name}`);
        continue;
      }

      artistsById.set(found.id, {
        deezer_id: found.id,
        name: found.name,
        genres: [genre.name],
      });

      const discography = await getArtistAlbums(found.id);
      const selected = pickAlbums(discography.data ?? []);

      for (const { album: summary, originalReleaseDate } of selected) {
        const detail = await getAlbum(summary.id);
        const tracks = detail.tracks?.data ?? [];

        if (tracks.length === 0) {
          console.log(`     [!] "${detail.title}" vino sin tracklist, se omite.`);
          continue;
        }

        // Géneros del álbum según Deezer, filtrados a los que existen en nuestra
        // curaduría. Un álbum puede venir sin géneros o con géneros que no usamos
        // (Blues, Folk, Dance...): en ese caso queda al menos el género por el que
        // llegamos a ese artista, así ningún álbum se pierde de los filtros del listado.
        const albumGenres = new Set<string>();
        for (const g of detail.genres?.data ?? []) {
          const mapped = genreNameByDeezerId.get(g.id);
          if (mapped) albumGenres.add(mapped);
        }
        albumGenres.add(genre.name);

        albumsById.set(detail.id, {
          deezer_id: detail.id,
          title: detail.title,
          release_date: detail.release_date,
          original_release_date: originalReleaseDate,
          cover_xl: detail.cover_xl ?? null,
          artist_deezer_id: found.id,
          artist_name: found.name,
          genres: [...albumGenres],
          tracks: tracks.map((track) => ({
            deezer_id: track.id,
            title: track.title,
            duration: track.duration,
          })),
        });
      }

      console.log(`  ${found.name} — ${selected.length} álbumes`);
    }
  }

  const artists = [...artistsById.values()];
  const albums = [...albumsById.values()];
  const trackCount = albums.reduce((total, album) => total + album.tracks.length, 0);

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, 'genres.json'), JSON.stringify(genres, null, 2), 'utf8');
  await writeFile(path.join(DATA_DIR, 'artists.json'), JSON.stringify(artists, null, 2), 'utf8');
  await writeFile(path.join(DATA_DIR, 'albums.json'), JSON.stringify(albums, null, 2), 'utf8');

  console.log('\n[fetch] Descarga terminada.');
  console.log(`[fetch] ${genres.length} géneros, ${artists.length} artistas, ${albums.length} álbumes, ${trackCount} canciones.`);
  console.log(`[fetch] Archivos escritos en ${DATA_DIR}`);
  console.log('[fetch] Acordate de commitearlos: son los que usa `npm run seed`.');
}

if (require.main === module) {
  void fetchCatalog().catch((error) => {
    console.error('[fetch] Falló la descarga de metadata:');
    console.error(error);
    process.exit(1);
  });
}
