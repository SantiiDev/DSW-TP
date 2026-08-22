// Modelo de un género dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/genreService.ts).

/**
 * Estados de moderación de un álbum, igual que el enum ALBUMS.state del backend.
 * Se declara acá y no se importa de la feature artist para que las features sigan
 * siendo independientes entre sí.
 */
export type ContentState = 'pending' | 'approved' | 'rejected';

/** Álbum del género, tal como viaja dentro de su ficha en la API. */
export type GenreAlbumApiResponse = {
  id_album: number;
  title: string;
  state: ContentState;
};

/**
 * Forma cruda con la que viaja un género en las respuestas de la API.
 * Respeta los nombres del backend (snake_case, como en el DER); pasarlo al modelo
 * es justamente lo que hace el servicio.
 */
export type GenreApiResponse = {
  id_genre: number;
  name: string;
  albums: GenreAlbumApiResponse[];
};

/** Álbum del género, reducido a lo que hace falta para nombrarlo en pantalla. */
export class GenreAlbum {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly state: ContentState
  ) {}

  /** ¿Ya forma parte del catálogo público? */
  get isApproved(): boolean {
    return this.state === 'approved';
  }
}

export class Genre {
  constructor(
    public readonly id: number,
    public readonly name: string,
    /**
     * Álbumes que tienen asignado este género. La API los manda con la ficha
     * porque son los que bloquean su eliminación: borrar el género se llevaría
     * sus vínculos de la tabla genres_albums.
     */
    public readonly albums: GenreAlbum[]
  ) {}

  /**
   * Todos los álbumes vinculados, sin mirar su estado. Es el número que importa
   * para la baja: el vínculo de un álbum pendiente se perdería igual que el de
   * uno aprobado.
   */
  get albumsCount(): number {
    return this.albums.length;
  }

  /** Solo los álbumes ya aprobados: son los únicos que se muestran al público. */
  get publicAlbums(): GenreAlbum[] {
    return this.albums.filter((album) => album.isApproved);
  }

  get publicAlbumsCount(): number {
    return this.publicAlbums.length;
  }

  /** Cantidad de álbumes en texto, ya en singular o plural ("1 álbum" / "3 álbumes"). */
  get albumsLabel(): string {
    return this.albumsCount === 1 ? '1 álbum' : `${this.albumsCount} álbumes`;
  }

  /**
   * ¿Se puede eliminar? Solo si no tiene ningún álbum asignado.
   *
   * Es solo para no mostrar un botón que va a fallar: quien corta de verdad es la
   * API, que responde 409 mientras queden álbumes vinculados.
   */
  get canBeDeleted(): boolean {
    return this.albumsCount === 0;
  }
}
