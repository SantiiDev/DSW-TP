// Cliente HTTP mínimo para la API pública de Deezer.
//
// Lo usa EXCLUSIVAMENTE el script de descarga (`fetch-metadata.ts`). La aplicación
// en runtime nunca llega hasta acá: su única fuente de datos es la base propia.
//
// Deezer no pide autenticación, pero limita a ~50 pedidos cada 5 segundos por IP.
// Cuando se pasa ese límite NO responde con un código HTTP de error: devuelve un 200
// con un cuerpo `{ error: { code: 4, message: 'Quota limit exceeded' } }`. Por eso hay
// que revisar el cuerpo de cada respuesta y no solamente `response.ok`.
import { env } from '../shared/config/env';

/** Forma del error que Deezer devuelve dentro de un 200 OK. */
type DeezerErrorBody = {
  error?: { type?: string; message?: string; code?: number };
};

// Espera la cantidad de milisegundos indicada.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pide un recurso a Deezer y devuelve su JSON ya tipado.
 *
 * Recibe una ruta relativa (ej: `/album/302127`) y devuelve el cuerpo de la respuesta.
 * Espera `requestDelayMs` antes de cada llamada para no pasarse del límite de la API, y
 * reintenta con esperas cada vez más largas si Deezer contesta que se excedió la cuota.
 */
export async function deezerGet<T>(path: string): Promise<T> {
  const url = `${env.metadata.baseUrl}${path}`;

  for (let attempt = 1; attempt <= env.metadata.maxRetries; attempt++) {
    // La espera va ANTES del pedido: así queda un piso garantizado entre llamadas
    // sucesivas, sin importar cuánto haya tardado la anterior.
    await sleep(env.metadata.requestDelayMs);

    const response = await fetch(url);

    if (!response.ok) {
      // 5xx suele ser un hipo momentáneo de Deezer y conviene reintentar; un 4xx
      // significa que la ruta está mal armada y reintentar no va a cambiar nada.
      if (response.status >= 500 && attempt < env.metadata.maxRetries) {
        await sleep(attempt * 2000);
        continue;
      }
      throw new Error(`Deezer respondió ${response.status} ${response.statusText} en ${path}`);
    }

    const body = (await response.json()) as T & DeezerErrorBody;

    if (body.error) {
      // code 4 = cuota excedida. Se espera cada vez más y se vuelve a intentar.
      if (body.error.code === 4 && attempt < env.metadata.maxRetries) {
        console.log(`  [deezer] cuota excedida, esperando ${attempt * 5}s antes de reintentar...`);
        await sleep(attempt * 5000);
        continue;
      }
      throw new Error(`Deezer devolvió un error en ${path}: ${body.error.message ?? 'desconocido'}`);
    }

    return body;
  }

  throw new Error(`Deezer no respondió correctamente a ${path} tras ${env.metadata.maxRetries} intentos.`);
}

// --- Formas de las respuestas de Deezer que usa el seed -----------------------
// Solo se declaran los campos que realmente se leen; las respuestas traen muchos
// más (miniaturas en cinco tamaños, links a la web, previews en mp3, etc.).

export type DeezerArtist = {
  id: number;
  name: string;
  nb_fan?: number;
  picture_xl?: string;
};

export type DeezerAlbumSummary = {
  id: number;
  title: string;
  record_type: string;
  release_date: string;
  fans?: number;
  cover_xl?: string;
};

export type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
};

export type DeezerAlbumDetail = {
  id: number;
  title: string;
  record_type: string;
  release_date: string;
  cover_xl?: string;
  nb_tracks?: number;
  artist?: { id: number; name: string };
  genres?: { data?: { id: number; name: string }[] };
  tracks?: { data?: DeezerTrack[] };
};

export type DeezerSearchResult<T> = { data?: T[]; total?: number };

/** Devuelve un artista por su id de Deezer. Se usa cuando la curaduría lo fija a mano. */
export function getArtist(artistId: number): Promise<DeezerArtist> {
  return deezerGet(`/artist/${artistId}`);
}

/** Busca un artista por nombre y devuelve los resultados ordenados por relevancia. */
export function searchArtist(name: string): Promise<DeezerSearchResult<DeezerArtist>> {
  return deezerGet(`/search/artist?q=${encodeURIComponent(name)}&limit=5`);
}

/** Devuelve la discografía de un artista (incluye singles, EPs y recopilatorios). */
export function getArtistAlbums(artistId: number): Promise<DeezerSearchResult<DeezerAlbumSummary>> {
  return deezerGet(`/artist/${artistId}/albums?limit=100`);
}

/** Devuelve el detalle de un álbum, con sus géneros y su tracklist completo. */
export function getAlbum(albumId: number): Promise<DeezerAlbumDetail> {
  return deezerGet(`/album/${albumId}`);
}
