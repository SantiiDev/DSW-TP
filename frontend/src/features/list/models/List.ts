// Modelo de una lista personalizada dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/listService.ts).

/**
 * De qué es una lista. Son los mismos valores que la columna LISTS.type del
 * backend (ver LIST_TYPES en shared/types/enums.ts).
 *
 * Una lista es de un tipo o del otro, nunca de los dos: la regla la garantiza el
 * modelo de datos, acá solo se representa.
 */
export const LIST_TYPES = ['album', 'song'] as const;
export type ListType = (typeof LIST_TYPES)[number];

/** Autor de la lista, tal como viaja dentro de la API. */
export type ListUserApiResponse = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

/** Artista del ítem de una lista, tal como viaja en la API. */
export type ListItemArtistApiResponse = {
  id_artist: number;
  name: string;
};

/** Ítem de la lista —un álbum o una canción—, tal como viaja en el detalle y en "mis listas". */
export type ListItemApiResponse = {
  kind: ListType;
  id: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist: ListItemArtistApiResponse | null;
  /** Solo en un ítem canción: el álbum al que pertenece. null en un ítem álbum. */
  id_album: number | null;
  position: number;
};

/**
 * Forma cruda con la que viaja una lista en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al
 * modelo es justamente lo que hace el servicio.
 *
 * `items` es opcional porque solo la manda el detalle (`GET /lists/:id`) y
 * "mis listas" (`GET /lists/mine`). El explorador (`GET /lists`) devuelve la
 * versión corta: ahí alcanza con `covers` y los contadores para la tarjeta.
 */
export type ListApiResponse = {
  id_list: number;
  name: string;
  description: string | null;
  type: ListType;
  creation_date: string;
  user: ListUserApiResponse | null;
  items_count: number;
  likes_count: number;
  liked_by_me: boolean;
  /** Siempre cinco posiciones, con null en las que faltan: es el collage de la tarjeta. */
  covers: (string | null)[];
  items?: ListItemApiResponse[];
};

/** Autor de una lista, reducido a lo que se muestra en su tarjeta. */
export class ListUser {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly urlAvatar: string | null
  ) {}
}

/** Artista de un ítem dentro de una lista. */
export class ListItemArtist {
  constructor(
    public readonly id: number,
    public readonly name: string
  ) {}
}

/**
 * Ítem dentro de una lista, con la posición en la que quedó agregado.
 *
 * Es la misma clase para un álbum y para una canción: las dos se dibujan con la
 * misma tarjeta y solo cambia a dónde enlazan. La portada, el año y el artista
 * de una canción son los de su álbum, porque una pista no tiene ninguno propio.
 */
export class ListItem {
  constructor(
    public readonly kind: ListType,
    public readonly id: number,
    public readonly title: string,
    public readonly urlCover: string | null,
    public readonly releaseYear: number | null,
    public readonly artist: ListItemArtist | null,
    /** El álbum de la canción. null en un ítem álbum, donde el álbum es él mismo. */
    public readonly albumId: number | null,
    public readonly position: number
  ) {}

  /** Nombre del artista, o un texto de reemplazo si el ítem quedó sin uno. */
  get artistName(): string {
    return this.artist?.name ?? 'Artista desconocido';
  }

  /** A dónde lleva la tarjeta: la ficha del álbum o la de la canción. */
  get path(): string {
    return this.kind === 'album' ? `/albums/${this.id}` : `/songs/${this.id}`;
  }
}

export class List {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    /** Si es una lista de álbumes o de canciones. No se puede cambiar. */
    public readonly type: ListType,
    public readonly creationDate: Date,
    public readonly user: ListUser | null,
    public readonly itemsCount: number,
    public readonly likesCount: number,
    /** Si el usuario que mira ya le puso "me gusta". Siempre false sin sesión. */
    public readonly likedByMe: boolean,
    /** Siempre cinco posiciones, con null en las que faltan: el collage de la tarjeta. */
    public readonly covers: (string | null)[],
    public readonly items: ListItem[] = []
  ) {}

  /** Nombre de quien la armó, o un texto de reemplazo si la cuenta se dio de baja. */
  get authorName(): string {
    return this.user?.username ?? 'Usuario eliminado';
  }

  /** ¿Es una lista de canciones? Decide los textos de toda la pantalla. */
  get isSongList(): boolean {
    return this.type === 'song';
  }

  /**
   * Ruta de la ficha de la lista. Es a donde llevan las tarjetas y lo que copia
   * el botón "Compartir": la página es pública, así que el enlace lo puede abrir
   * cualquiera, tenga o no cuenta (mismo criterio que Review.sharePath).
   */
  get sharePath(): string {
    return `/lists/${this.id}`;
  }

  /**
   * Cantidad de ítems en texto, en singular o plural y con la palabra que
   * corresponde al tipo ("1 álbum", "3 álbumes", "1 canción", "5 canciones").
   */
  get itemsLabel(): string {
    if (this.isSongList) {
      return this.itemsCount === 1 ? '1 canción' : `${this.itemsCount} canciones`;
    }

    return this.itemsCount === 1 ? '1 álbum' : `${this.itemsCount} álbumes`;
  }

  /** Cantidad de "me gusta", con separador de miles. */
  get likesLabel(): string {
    return this.likesCount.toLocaleString('es-AR');
  }

  /** Fecha de creación, como se muestra en la tarjeta ("12 de septiembre de 2026"). */
  get dateLabel(): string {
    return this.creationDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * ¿Puede editarla o borrarla este usuario?
   *
   * Es solo para no mostrar botones que van a fallar: quien corta de verdad es
   * la API, que además exige membresía Pro vigente. El backend también deja
   * borrar (no editar) a un ADMIN; acá no hace falta ese caso porque el panel de
   * administración no gestiona listas.
   */
  canBeEditedBy(userId: number | null): boolean {
    return userId !== null && this.user?.id === userId;
  }

  /** ¿Ya tiene este ítem agregado? Lo usa el botón "Agregar a una lista". */
  hasItem(itemId: number): boolean {
    return this.items.some((item) => item.id === itemId);
  }
}
