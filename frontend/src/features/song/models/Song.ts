// Modelo de una canción dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/songService.ts).
import type { BadgeTone } from '../../../core/components/Badge';

/**
 * Estados de moderación del catálogo, igual que el enum SONG.state del backend.
 * Se declara acá y no se importa de otra feature para que sigan siendo
 * independientes entre sí (mismo criterio que models/Genre.ts y models/Album.ts).
 */
export const CONTENT_STATES = ['pending', 'approved', 'rejected'] as const;
export type ContentState = (typeof CONTENT_STATES)[number];

/** Nombre para mostrar de cada estado: en la UI nunca se escribe el valor crudo. */
export const STATE_LABELS: Record<ContentState, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

/**
 * Color de la pastilla de cada estado (ver core/components/Badge).
 * Se define acá, junto a las etiquetas, para que la tabla del panel y los aportes
 * del perfil pinten el mismo estado del mismo color.
 */
export const STATE_TONES: Record<ContentState, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

/**
 * Cómo se ordena el explorador. Son los mismos valores que acepta la API en
 * `GET /songs/explore?sort=` (ver SONG_SORTS en song.schema.ts del backend).
 *
 * No incluye `year` como el de álbum: la canción no tiene año propio, lo hereda
 * de su álbum, y ordenar por él dejaría cada tracklist pegado en bloque.
 */
export type SongSort = 'rating' | 'reviews' | 'recent' | 'title';

/** Artista del álbum de la canción, tal como viaja en la API. */
export type SongArtistApiResponse = {
  id_artist: number;
  name: string;
};

/** Álbum al que pertenece la canción, tal como viaja en la API. */
export type SongAlbumApiResponse = {
  id_album: number;
  title: string;
  release_year: number | null;
  url_cover: string | null;
  artist: SongArtistApiResponse | null;
};

/** Usuario que cargó la canción, tal como viaja en la API. */
export type SongCreatorApiResponse = {
  id_user: number;
  username: string;
};

/**
 * Forma cruda con la que viaja una canción en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al modelo
 * es justamente lo que hace el servicio.
 */
export type SongApiResponse = {
  id_song: number;
  number_track: number;
  song_title: string;
  duration: number | null;
  state: ContentState;
  created_by: number | null;
  creator: SongCreatorApiResponse | null;
  album: SongAlbumApiResponse | null;
  average_rating: number;
  reviews_count: number;
};

/** Artista del álbum de la canción, reducido a lo que hace falta para nombrarlo. */
export class SongArtist {
  constructor(
    public readonly id: number,
    public readonly name: string
  ) {}
}

/**
 * Álbum de la canción, reducido a lo que hace falta para ubicarla.
 *
 * Trae la carátula y el año porque la ficha de la canción los muestra: una
 * canción no tiene portada propia, así que la del álbum es la única imagen que
 * puede acompañarla.
 */
export class SongAlbum {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly releaseYear: number | null = null,
    public readonly urlCover: string | null = null,
    public readonly artist: SongArtist | null = null
  ) {}
}

/** Autor de un aporte al catálogo, para poder mostrarlo en la cola de moderación. */
export class SongCreator {
  constructor(
    public readonly id: number,
    public readonly username: string
  ) {}
}

export class Song {
  constructor(
    public readonly id: number,
    public readonly numberTrack: number,
    public readonly title: string,
    /** Duración en segundos, o null si no se conoce. */
    public readonly duration: number | null,
    public readonly state: ContentState,
    /** Usuario que la cargó, o null si vino del catálogo inicial (el seed). */
    public readonly createdBy: number | null,
    /** null en una canción suelta: la FK hacia ALBUMS admite NULL. */
    public readonly album: SongAlbum | null,
    /** Promedio de las reseñas. Es 0 mientras la canción no tenga ninguna. */
    public readonly averageRating: number,
    public readonly reviewsCount: number,
    /** Quién la propuso, o null si es parte del catálogo inicial. */
    public readonly creator: SongCreator | null = null
  ) {}

  /** Título del álbum, o el texto que corresponde a una canción suelta. */
  get albumTitle(): string {
    return this.album?.title ?? 'Sin álbum';
  }

  /** Nombre del artista del álbum, o un texto de reemplazo si no lo tiene. */
  get artistName(): string {
    return this.album?.artist?.name ?? 'Artista desconocido';
  }

  /** Nombre de quien propuso el aporte, para mostrar en la cola de moderación. */
  get creatorName(): string {
    return this.creator?.username ?? 'el catálogo inicial';
  }

  /** Año de lanzamiento del álbum, o un guión si no se conoce. */
  get yearLabel(): string {
    const year = this.album?.releaseYear ?? null;
    return year === null ? '—' : String(year);
  }

  /**
   * Dónde está la canción, en una línea: "Nevermind · Nirvana", o solo el texto
   * de canción suelta cuando no pertenece a ningún álbum.
   */
  get locationLabel(): string {
    if (!this.album) return 'Canción suelta, sin álbum';
    return `${this.album.title} · ${this.artistName}`;
  }

  /** Duración lista para mostrar ("3:07"), o "--:--" si no se conoce. */
  get durationLabel(): string {
    if (this.duration === null) return '--:--';

    const minutes = Math.floor(this.duration / 60);
    // padStart deja "3:07" y no "3:7", que se leería como treinta y siete.
    return `${minutes}:${String(this.duration % 60).padStart(2, '0')}`;
  }

  /** ¿Ya forma parte del catálogo público? */
  get isApproved(): boolean {
    return this.state === 'approved';
  }

  /** ¿Está esperando que un ADMIN la revise? */
  get isPending(): boolean {
    return this.state === 'pending';
  }

  /** ¿Alguien ya la calificó? Distingue "sin reseñas" de un promedio bajo. */
  get hasRating(): boolean {
    return this.averageRating > 0;
  }

  /** Promedio con un decimal, como se muestra al lado de la estrella ("4.5"). */
  get ratingLabel(): string {
    return this.averageRating.toFixed(1);
  }

  /**
   * ¿Este usuario puede editarla? Mismo criterio que el backend: un ADMIN puede
   * con cualquiera, y el resto solo con las canciones que cargó.
   *
   * Es solo para no mostrar botones que van a fallar: quien corta de verdad es la
   * API, que compara el created_by contra el usuario del token.
   */
  canBeEditedBy(userId: number, isAdmin: boolean): boolean {
    return isAdmin || this.createdBy === userId;
  }
}
