// Modelo de una lista personalizada dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/listService.ts).

/** Autor de la lista, tal como viaja dentro de la API. */
export type ListUserApiResponse = {
  id_user: number;
  username: string;
  url_avatar: string | null;
};

/** Artista de un álbum de la lista, tal como viaja en la API. */
export type ListAlbumArtistApiResponse = {
  id_artist: number;
  name: string;
};

/** Álbum de la lista, tal como viaja en el detalle y en "mis listas". */
export type ListAlbumApiResponse = {
  id_album: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist: ListAlbumArtistApiResponse | null;
  position: number;
};

/**
 * Forma cruda con la que viaja una lista en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al
 * modelo es justamente lo que hace el servicio.
 *
 * `albums` es opcional porque solo la manda el detalle (`GET /lists/:id`) y
 * "mis listas" (`GET /lists/mine`). El explorador (`GET /lists`) devuelve la
 * versión corta: ahí alcanza con `covers` y los contadores para la tarjeta.
 */
export type ListApiResponse = {
  id_list: number;
  name: string;
  description: string | null;
  creation_date: string;
  user: ListUserApiResponse | null;
  albums_count: number;
  likes_count: number;
  liked_by_me: boolean;
  /** Siempre cinco posiciones, con null en las que faltan: es el collage de la tarjeta. */
  covers: (string | null)[];
  albums?: ListAlbumApiResponse[];
};

/** Autor de una lista, reducido a lo que se muestra en su tarjeta. */
export class ListUser {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly urlAvatar: string | null
  ) {}
}

/** Artista de un álbum dentro de una lista. */
export class ListAlbumArtist {
  constructor(
    public readonly id: number,
    public readonly name: string
  ) {}
}

/** Álbum dentro de una lista, con la posición en la que quedó agregado. */
export class ListAlbum {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly urlCover: string | null,
    public readonly releaseYear: number | null,
    public readonly artist: ListAlbumArtist | null,
    public readonly position: number
  ) {}

  /** Nombre del artista, o un texto de reemplazo si el álbum quedó sin uno. */
  get artistName(): string {
    return this.artist?.name ?? 'Artista desconocido';
  }
}

export class List {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly creationDate: Date,
    public readonly user: ListUser | null,
    public readonly albumsCount: number,
    public readonly likesCount: number,
    /** Si el usuario que mira ya le puso "me gusta". Siempre false sin sesión. */
    public readonly likedByMe: boolean,
    /** Siempre cinco posiciones, con null en las que faltan: el collage de la tarjeta. */
    public readonly covers: (string | null)[],
    public readonly albums: ListAlbum[] = []
  ) {}

  /** Nombre de quien la armó, o un texto de reemplazo si la cuenta se dio de baja. */
  get authorName(): string {
    return this.user?.username ?? 'Usuario eliminado';
  }

  /** Cantidad de álbumes en texto, en singular o plural ("1 álbum" / "3 álbumes"). */
  get albumsLabel(): string {
    return this.albumsCount === 1 ? '1 álbum' : `${this.albumsCount} álbumes`;
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
   * la API. El backend además deja borrar (no editar) a un ADMIN; acá no hace
   * falta ese caso porque el panel de administración no gestiona listas.
   */
  canBeEditedBy(userId: number | null): boolean {
    return userId !== null && this.user?.id === userId;
  }

  /** ¿Ya tiene este álbum agregado? Lo usa el botón "Agregar a una lista" de la ficha del álbum. */
  hasAlbum(albumId: number): boolean {
    return this.albums.some((album) => album.id === albumId);
  }
}
