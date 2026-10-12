// Modelo de un artista dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/artistService.ts).
import type { BadgeTone } from '../../../core/components/Badge';

/** Estados de moderación del catálogo, igual que el enum ARTIST.state del backend. */
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
 * Se define acá, junto a las etiquetas, para que la ficha, la tabla del panel y
 * la cola de solicitudes pinten el mismo estado del mismo color.
 */
export const STATE_TONES: Record<ContentState, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

/** Álbum del artista, tal como viaja dentro de su ficha en la API. */
export type ArtistAlbumApiResponse = {
  id_album: number;
  title: string;
};

/** Usuario que cargó el artista, tal como viaja dentro de su ficha en la API. */
export type ArtistCreatorApiResponse = {
  id_user: number;
  username: string;
};

/**
 * Forma cruda con la que viaja un artista en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al modelo
 * es justamente lo que hace el servicio.
 */
export type ArtistApiResponse = {
  id_artist: number;
  name: string;
  biography: string | null;
  state: ContentState;
  created_by: number | null;
  creator: ArtistCreatorApiResponse | null;
  albums: ArtistAlbumApiResponse[];
};

/**
 * Artista parecido a uno que se está por cargar, tal como lo devuelve
 * /artists/similar. Es una vista mínima: solo se usa para avisar "ojo, ya existe
 * algo parecido", no para mostrar una ficha.
 */
export type SimilarArtist = {
  id_artist: number;
  name: string;
  state: ContentState;
};

/** Álbum del artista, reducido a lo que hace falta para nombrarlo en pantalla. */
export class ArtistAlbum {
  constructor(
    public readonly id: number,
    public readonly title: string
  ) {}
}

/** Autor de un aporte al catálogo, para poder mostrarlo en la cola de moderación. */
export class ArtistCreator {
  constructor(
    public readonly id: number,
    public readonly username: string
  ) {}
}

export class Artist {
  constructor(
    public readonly id: number,
    public readonly name: string,
    /** null si todavía no le cargaron una biografía. */
    public readonly biography: string | null,
    public readonly state: ContentState,
    /** Usuario que lo cargó, o null si vino del catálogo inicial (el seed). */
    public readonly createdBy: number | null,
    /**
     * Álbumes que dependen de este artista. La API los manda con la ficha porque
     * son los que bloquean su eliminación: la FK de ALBUMS es RESTRICT.
     */
    public readonly albums: ArtistAlbum[],
    /** Quién lo propuso, o null si es parte del catálogo inicial. */
    public readonly creator: ArtistCreator | null = null
  ) {}

  /** Nombre de quien propuso el aporte, para mostrar en la cola de moderación. */
  get creatorName(): string {
    return this.creator?.username ?? 'el catálogo inicial';
  }

  /** ¿Ya forma parte del catálogo público? */
  get isApproved(): boolean {
    return this.state === 'approved';
  }

  /** ¿Está esperando que un ADMIN lo revise? */
  get isPending(): boolean {
    return this.state === 'pending';
  }

  get albumsCount(): number {
    return this.albums.length;
  }

  /** Cantidad de álbumes en texto, ya en singular o plural ("1 álbum" / "3 álbumes"). */
  get albumsLabel(): string {
    return this.albumsCount === 1 ? '1 álbum' : `${this.albumsCount} álbumes`;
  }

  /**
   * ¿Este usuario puede editarlo? Mismo criterio que el backend: un ADMIN puede
   * con cualquiera, y el resto solo con los artistas que cargó.
   *
   * Es solo para no mostrar botones que van a fallar: quien corta de verdad es la
   * API, que compara el created_by contra el usuario del token.
   */
  canBeEditedBy(userId: number, isAdmin: boolean): boolean {
    return isAdmin || this.createdBy === userId;
  }
}
