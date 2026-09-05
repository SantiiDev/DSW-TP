// Modelo de una reseña dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/reviewService.ts).

/**
 * Estado de moderación de una reseña, igual que el enum REVIEW.state del backend.
 *
 * 'deleted' existe en el enum de la base pero no se usa: la baja de una reseña es
 * física, porque el índice único por usuario e ítem no distingue estados y una
 * fila "borrada" le impediría al autor volver a reseñar lo mismo.
 */
export const REVIEW_STATES = ['published', 'hidden', 'deleted'] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

/** A qué apunta una reseña. Se usa para pedir, crear y linkear. */
export type ReviewTargetKind = 'album' | 'song';

/** Escala de calificación: de media estrella a cinco, de a media. */
export const MIN_RATING = 0.5;
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;

/**
 * A partir de cuántos caracteres una reseña se corta con un "Leer más".
 * Son unos cuatro renglones: lo suficiente para saber de qué va sin que una
 * reseña larguísima empuje al resto del listado fuera de la pantalla.
 */
export const EXCERPT_LENGTH = 320;

export type ReviewUserApiResponse = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

export type ReviewArtistApiResponse = {
  id_artist: number;
  name: string;
};

export type ReviewAlbumApiResponse = {
  id_album: number;
  title: string;
  url_cover: string | null;
  artist: ReviewArtistApiResponse | null;
};

export type ReviewSongApiResponse = {
  id_song: number;
  song_title: string;
  number_track: number;
  album: ReviewAlbumApiResponse | null;
};

/**
 * Forma cruda con la que viaja una reseña en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al modelo
 * es justamente lo que hace el servicio.
 *
 * `album` y `song` se excluyen entre sí: una reseña apunta a uno de los dos y el
 * otro llega en null.
 */
export type ReviewApiResponse = {
  id_review: number;
  rating: number;
  text_review: string | null;
  review_date: string;
  /** null mientras la reseña siga tal como se publicó. */
  edited_date: string | null;
  state: ReviewState;
  user: ReviewUserApiResponse | null;
  album: ReviewAlbumApiResponse | null;
  song: ReviewSongApiResponse | null;
  likes_count: number;
  liked_by_me: boolean;
  comments_count: number;
};

/** Comentario de una reseña, tal como viaja en la API. */
export type ReviewCommentApiResponse = {
  id_comment: number;
  text_comment: string;
  comment_date: string;
  id_review: number;
  user: ReviewUserApiResponse | null;
};

/** Estadísticas de las reseñas de un usuario, tal como viajan en la API. */
export type ReviewStatsApiResponse = {
  total: number;
  distribution: number[];
  albums: number;
  songs: number;
};

/**
 * Estadísticas de las reseñas de un usuario. Es lo que alimenta el histograma de
 * calificaciones de su perfil y sus contadores.
 */
export class ReviewStats {
  constructor(
    /** Cuántas reseñas publicó. */
    public readonly total: number,
    /**
     * Cuántas puso en cada media estrella, de 0,5 a 5. Diez posiciones, que es
     * justo lo que espera el histograma del perfil.
     */
    public readonly distribution: number[],
    public readonly albums: number,
    public readonly songs: number
  ) {}

  /**
   * Ítems escuchados: la suma de álbumes y canciones calificados. Se deriva de las
   * reseñas porque no hay tabla propia para esto: si alguien reseñó algo, es
   * porque lo escuchó.
   */
  get listened(): number {
    return this.albums + this.songs;
  }
}

/** Diez posiciones en cero: el estado mientras no hay reseñas que contar. */
export const EMPTY_REVIEW_STATS = new ReviewStats(0, new Array<number>(10).fill(0), 0, 0);

/** Autor de la reseña, reducido a lo que se muestra en su tarjeta. */
export class ReviewAuthor {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly avatarUrl: string | null
  ) {}
}

/** Álbum reseñado, o el álbum al que pertenece la canción reseñada. */
export class ReviewAlbumRef {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly coverUrl: string | null,
    /** Solo viene cuando el álbum es el ítem reseñado, no cuando es el de una pista. */
    public readonly artistName: string | null
  ) {}
}

/** Canción reseñada, con el álbum del que es pista. */
export class ReviewSongRef {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly numberTrack: number,
    public readonly album: ReviewAlbumRef | null
  ) {}
}

/** Comentario de una reseña. */
export class ReviewComment {
  constructor(
    public readonly id: number,
    public readonly text: string,
    public readonly date: Date,
    public readonly reviewId: number,
    public readonly author: ReviewAuthor | null
  ) {}

  get authorName(): string {
    return this.author?.username ?? 'Usuario eliminado';
  }

  /** Fecha lista para mostrar ("12 de marzo de 2026"). */
  get dateLabel(): string {
    return this.date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** ¿Este usuario puede borrarlo? Su autor, o un ADMIN. Igual que en el backend. */
  canBeDeletedBy(userId: number | null, isAdmin: boolean): boolean {
    return isAdmin || (userId !== null && this.author?.id === userId);
  }
}

export class Review {
  constructor(
    public readonly id: number,
    /** De 0,5 a 5, de a media estrella. */
    public readonly rating: number,
    /** null cuando el usuario calificó sin escribir nada, que es lo más común. */
    public readonly text: string | null,
    public readonly date: Date,
    /** Cuándo se editó por última vez, o null si nunca se tocó desde que se publicó. */
    public readonly editedDate: Date | null,
    public readonly state: ReviewState,
    /** null solo en teoría: la FK a users es NOT NULL. */
    public readonly author: ReviewAuthor | null,
    public readonly album: ReviewAlbumRef | null,
    public readonly song: ReviewSongRef | null,
    /** Cuántos "me gusta" recibió. */
    public readonly likesCount: number = 0,
    /** Si el usuario logueado ya se lo dio: decide si el corazón va lleno o vacío. */
    public readonly likedByMe: boolean = false,
    public readonly commentsCount: number = 0
  ) {}

  /** ¿Se está mostrando al público? Una oculta solo la ven su autor y un ADMIN. */
  get isPublished(): boolean {
    return this.state === 'published';
  }

  get isHidden(): boolean {
    return this.state === 'hidden';
  }

  /** ¿Trae texto, o es una calificación a secas? */
  get hasText(): boolean {
    return this.text !== null && this.text.trim() !== '';
  }

  /** ¿Es lo bastante larga como para cortarla con un "Leer más"? */
  get isLong(): boolean {
    return this.text !== null && this.text.length > EXCERPT_LENGTH;
  }

  /**
   * Las primeras líneas de la reseña, para mostrar antes de "Leer más".
   *
   * Se corta en el último espacio antes del límite y no en el carácter exacto,
   * para no partir una palabra al medio.
   */
  get excerpt(): string {
    if (this.text === null) return '';
    if (!this.isLong) return this.text;

    const cut = this.text.slice(0, EXCERPT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');

    return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}...`;
  }

  /**
   * Ruta de la página de esta reseña. Es a donde apuntan el botón de compartir y
   * el "Leer más..." de su tarjeta.
   *
   * Antes era la ficha del ítem con un ancla (`/albums/5#review-123`), pero ese
   * enlace no servía: la ficha carga las reseñas de a cinco, así que si la
   * compartida no estaba en la primera tanda, el ancla no existía cuando el
   * navegador saltaba y el que abría el link caía arriba del álbum sin entender
   * qué le habían compartido.
   */
  get sharePath(): string {
    return `/reviews/${this.id}`;
  }

  /** Nombre del autor, o un texto de reemplazo si la reseña quedó sin uno. */
  get authorName(): string {
    return this.author?.username ?? 'Usuario eliminado';
  }

  /** Calificación con un decimal, como se muestra al lado de las estrellas ("4.5"). */
  get ratingLabel(): string {
    return this.rating.toFixed(1);
  }

  /** Fecha lista para mostrar ("12 de marzo de 2026"). */
  get dateLabel(): string {
    return this.date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * ¿La modificaron después de publicarla? Es lo que decide si la tarjeta muestra
   * la marca de "Editado".
   */
  get isEdited(): boolean {
    return this.editedDate !== null;
  }

  /**
   * Cuándo se editó, para el tooltip de la marca. Vacío si nunca se editó.
   * Lleva la hora además de la fecha: una reseña se puede editar el mismo día que
   * se publicó, y ahí sin la hora el dato no dice nada.
   */
  get editedLabel(): string {
    if (this.editedDate === null) return '';

    return this.editedDate.toLocaleString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Si es de un álbum o de una pista. Decide el link y el subtítulo de la tarjeta. */
  get targetKind(): ReviewTargetKind {
    return this.album !== null ? 'album' : 'song';
  }

  /**
   * Id del ítem reseñado, sea el álbum o la canción. Junto con targetKind arma el
   * filtro con el que se piden las otras reseñas del mismo ítem.
   *
   * Devuelve 0 si la reseña quedó sin ítem, que en la práctica no pasa: las dos
   * FK no pueden ser NULL a la vez (lo valida la entidad a nivel de fila).
   */
  get targetId(): number {
    return this.album?.id ?? this.song?.id ?? 0;
  }

  /** Título del ítem reseñado. */
  get targetTitle(): string {
    return this.album?.title ?? this.song?.title ?? 'Ítem eliminado';
  }

  /**
   * La línea de abajo del título: el artista si se reseñó un álbum, y el disco al
   * que pertenece si se reseñó una pista.
   */
  get targetSubtitle(): string {
    if (this.album) return this.album.artistName ?? 'Artista desconocido';
    return this.song?.album?.title ?? 'Sin álbum';
  }

  /** Carátula del ítem. Una canción no tiene portada propia: usa la de su álbum. */
  get coverUrl(): string | null {
    return this.album?.coverUrl ?? this.song?.album?.coverUrl ?? null;
  }

  /** A dónde lleva la tarjeta al hacerle click. */
  get targetLink(): string {
    return this.album ? `/albums/${this.album.id}` : `/songs/${this.song?.id ?? ''}`;
  }

  /**
   * ¿Este usuario puede editarla? Mismo criterio que el backend: SOLO su autor.
   *
   * A diferencia de un álbum, acá un ADMIN tampoco puede: editarle el texto a otro
   * sería ponerle palabras en la boca. Es solo para no mostrar botones que van a
   * fallar; quien corta de verdad es la API.
   */
  canBeEditedBy(userId: number | null): boolean {
    return userId !== null && this.author?.id === userId;
  }

  /** ¿Puede eliminarla? Su autor, o un ADMIN. */
  canBeDeletedBy(userId: number | null, isAdmin: boolean): boolean {
    return isAdmin || this.canBeEditedBy(userId);
  }
}
