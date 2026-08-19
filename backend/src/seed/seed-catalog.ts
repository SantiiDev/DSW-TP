// Carga el catálogo (géneros, artistas, álbumes y canciones) en la base de datos.
//
// Lee los archivos de `seed/data/`, que están versionados en git: NO se conecta a
// internet ni consulta Deezer. Descargar esos archivos es tarea de otro script
// (`npm run seed:fetch`), que se corre a mano y solo cuando se quiere ampliar el
// catálogo. Esta separación es la que hace que el seed sea reproducible: cualquiera
// puede llenar la base con exactamente los mismos datos y sin conexión.
//
// Uso:  npm run seed:catalog     (o `npm run seed`, que corre todos los seeds)
//
// El orden de inserción respeta las dependencias del modelo:
//   géneros → artistas → álbumes (dependen del artista) → canciones (dependen del álbum)
//   y al final la tabla intermedia genres_albums.
//
// IDEMPOTENCIA: se puede correr las veces que haga falta sin duplicar nada. Como las
// tablas no guardan el id de Deezer —el modelo del TP no tiene esa columna y no se
// quiso agregar una al DER solo para esto—, cada registro se identifica por su clave
// natural: el género por `name`, el artista por `name`, el álbum por `title` + artista,
// y la canción por su número de pista dentro del álbum, que es justamente la clave
// única que ya declara la entidad (`uq_song_album_track`).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Album, Artist, Genre, GenreAlbum, Song } from '../entities';
import type { RawAlbum, RawArtist, RawGenre } from './fetch-metadata';

const DATA_DIR = path.join(__dirname, 'data');

// Lee y parsea uno de los archivos descargados. Si falta, avisa cómo generarlo en
// lugar de fallar con un ENOENT suelto.
async function readData<T>(fileName: string): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    throw new Error(
      `No se pudo leer ${filePath}. Si el archivo no está, generalo con \`npm run seed:fetch\`.`
    );
  }
}

// Extrae el año de una fecha `YYYY-MM-DD`. Devuelve null si no es un año razonable,
// porque la entidad Album valida que esté entre 1900 y 2100.
function toReleaseYear(date: string): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null;
}

/**
 * Inserta el catálogo completo. No abre ni cierra la conexión: de eso se encarga
 * quien la llama, para poder encadenar este seed con los demás.
 */
export async function seedCatalog(): Promise<void> {
  const rawGenres = await readData<RawGenre[]>('genres.json');
  const rawArtists = await readData<RawArtist[]>('artists.json');
  const rawAlbums = await readData<RawAlbum[]>('albums.json');

  console.log(
    `[seed] Catálogo a cargar: ${rawGenres.length} géneros, ${rawArtists.length} artistas, ${rawAlbums.length} álbumes.`
  );

  // --- Géneros --------------------------------------------------------------
  // Se guardan en un Map para después resolver por nombre el id que les asignó la
  // base, sin volver a consultarla una vez por álbum.
  const genreIdByName = new Map<string, number>();
  let newGenres = 0;

  for (const raw of rawGenres) {
    const [genre, created] = await Genre.findOrCreate({
      where: { name: raw.name },
      defaults: { name: raw.name },
    });
    genreIdByName.set(raw.name, genre.id_genre);
    if (created) newGenres++;
  }
  console.log(`[seed] Géneros: ${newGenres} nuevos, ${rawGenres.length - newGenres} ya existentes.`);

  // --- Artistas -------------------------------------------------------------
  // `state: 'approved'` y `created_by: null` porque son contenido del catálogo base,
  // no un aporte de un usuario PRO pendiente de moderación.
  //
  // La biografía queda en null: la API pública de Deezer no la expone. El CRUD de
  // artista permite completarla después desde el panel de administración.
  const artistIdByDeezerId = new Map<number, number>();
  let newArtists = 0;

  for (const raw of rawArtists) {
    const [artist, created] = await Artist.findOrCreate({
      where: { name: raw.name },
      defaults: { name: raw.name, state: 'approved', created_by: null },
    });
    artistIdByDeezerId.set(raw.deezer_id, artist.id_artist);
    if (created) newArtists++;
  }
  console.log(
    `[seed] Artistas: ${newArtists} nuevos, ${rawArtists.length - newArtists} ya existentes.`
  );

  // --- Álbumes, sus canciones y sus géneros ---------------------------------
  let newAlbums = 0;
  let newSongs = 0;
  let newLinks = 0;

  for (const raw of rawAlbums) {
    const idArtist = artistIdByDeezerId.get(raw.artist_deezer_id);
    if (idArtist === undefined) {
      // No debería pasar: albums.json y artists.json los genera la misma corrida.
      console.log(`  [!] "${raw.title}" referencia a un artista que no se cargó, se omite.`);
      continue;
    }

    const [album, albumCreated] = await Album.findOrCreate({
      where: { title: raw.title, id_artist: idArtist },
      defaults: {
        title: raw.title,
        id_artist: idArtist,
        // Se usa la fecha más antigua entre las ediciones del disco, no la de la
        // edición descargada: ver el comentario de `pickAlbums` en fetch-metadata.ts.
        release_year: toReleaseYear(raw.original_release_date),
        url_cover: raw.cover_xl,
        state: 'approved',
        created_by: null,
        // Arranca en 0 y lo va a ir recalculando el CRUD de reseñas.
        average_rating: 0,
      },
    });
    if (albumCreated) newAlbums++;

    // --- Canciones del álbum ---
    // Se traen de una sola consulta los números de pista que ya están cargados, en
    // vez de preguntar por cada canción: un álbum tiene decenas de pistas y así el
    // seed hace una consulta por álbum en lugar de una por canción.
    const existingSongs = await Song.findAll({
      where: { id_album: album.id_album },
      attributes: ['number_track'],
    });
    const existingTracks = new Set(existingSongs.map((song) => song.number_track));

    const songsToCreate = raw.tracks
      // El número de pista sale de la posición en el tracklist: Deezer no expone un
      // `track_position` en el detalle del álbum, pero sí devuelve las canciones en el
      // orden del disco. Numerar así, corrido, resuelve además los álbumes dobles: si
      // se copiara la numeración por disco habría dos pistas nº 1 en el mismo álbum y
      // se violaría el índice único uq_song_album_track.
      .map((track, index) => ({
        number_track: index + 1,
        song_title: track.title,
        duration: track.duration,
        state: 'approved' as const,
        created_by: null,
        id_album: album.id_album,
      }))
      .filter((song) => !existingTracks.has(song.number_track));

    if (songsToCreate.length > 0) {
      await Song.bulkCreate(songsToCreate);
      newSongs += songsToCreate.length;
    }

    // --- Géneros del álbum (tabla intermedia) ---
    for (const genreName of raw.genres) {
      const idGenre = genreIdByName.get(genreName);
      if (idGenre === undefined) continue;

      const [, linkCreated] = await GenreAlbum.findOrCreate({
        where: { id_genre: idGenre, id_album: album.id_album },
        defaults: { id_genre: idGenre, id_album: album.id_album },
      });
      if (linkCreated) newLinks++;
    }
  }

  console.log(`[seed] Álbumes: ${newAlbums} nuevos, ${rawAlbums.length - newAlbums} ya existentes.`);
  console.log(`[seed] Canciones: ${newSongs} nuevas.`);
  console.log(`[seed] Vínculos género-álbum: ${newLinks} nuevos.`);
}

// Permite correr solo este seed, sin tocar los demás.
if (require.main === module) {
  void (async () => {
    const { sequelize } = await import('../shared/db/sequelize');
    try {
      await sequelize.authenticate();
      console.log('[seed] Conectado a la base de datos.');
      await seedCatalog();
      console.log('[seed] Catálogo cargado.');
      await sequelize.close();
    } catch (error) {
      console.error('[seed] Falló la carga del catálogo:');
      console.error(error);
      process.exit(1);
    }
  })();
}
