// Modelo de un género dentro del frontend.
// El resto de la app trabaja SIEMPRE con esta clase; el JSON crudo del backend no
// sale nunca de la capa de servicios (ver services/genreService.ts).

/**
 * Estados de moderación de un álbum, igual que el enum ALBUMS.state del backend.
 * Se declara acá y no se importa de la feature artist para que las features sigan
 * siendo independientes entre sí.
 */
export type ContentState = 'pending' | 'approved' | 'rejected';

/** Artista del álbum, tal como viaja dentro de la ficha del género. */
export type GenreAlbumArtistApiResponse = {
  id_artist: number;
  name: string;
};

/**
 * Álbum del género tal como viaja en la API.
 *
 * Los campos de abajo del `state` son opcionales porque solo los manda la ficha
 * (`GET /genres/:id`). El listado (`GET /genres`) devuelve la versión corta, que
 * es todo lo que necesita para contar cuántos álbumes tiene cada género.
 */
export type GenreAlbumApiResponse = {
  id_album: number;
  title: string;
  state: ContentState;
  release_year?: number | null;
  url_cover?: string | null;
  average_rating?: number;
  artist?: GenreAlbumArtistApiResponse | null;
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

/** Artista de un álbum, reducido a lo que se muestra debajo del título. */
export class GenreAlbumArtist {
  constructor(
    public readonly id: number,
    public readonly name: string
  ) {}
}

/**
 * Álbum del género.
 *
 * Los datos de presentación (año, carátula, calificación y artista) tienen valor
 * por defecto porque el listado de géneros no los manda: ahí el álbum solo existe
 * para ser contado. La ficha sí los trae completos.
 */
export class GenreAlbum {
  constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly state: ContentState,
    public readonly releaseYear: number | null = null,
    public readonly urlCover: string | null = null,
    /** Promedio de las reseñas. Es 0 mientras el álbum no tenga ninguna. */
    public readonly averageRating: number = 0,
    public readonly artist: GenreAlbumArtist | null = null
  ) {}

  /** ¿Ya forma parte del catálogo público? */
  get isApproved(): boolean {
    return this.state === 'approved';
  }

  /** Nombre del artista, o un texto de reemplazo si el álbum quedó sin uno. */
  get artistName(): string {
    return this.artist?.name ?? 'Artista desconocido';
  }

  /**
   * ¿Alguien ya lo calificó? Sirve para distinguir "todavía nadie lo reseñó" de
   * "lo reseñaron y el promedio dio cero", que no puede pasar porque la
   * calificación mínima es media estrella.
   */
  get hasRating(): boolean {
    return this.averageRating > 0;
  }

  /** Promedio con un decimal, como se muestra al lado de la estrella ("4.5"). */
  get ratingLabel(): string {
    return this.averageRating.toFixed(1);
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
   * Años de lanzamiento distintos que hay entre sus álbumes públicos, del más
   * nuevo al más viejo. Es lo que llena el desplegable del filtro por año: se
   * arma con los años que existen de verdad y no con un rango fijo, así no se
   * ofrecen años que no van a devolver nada.
   */
  get releaseYears(): number[] {
    const years = this.publicAlbums
      .map((album) => album.releaseYear)
      .filter((year): year is number => year !== null);

    return [...new Set(years)].sort((a, b) => b - a);
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
