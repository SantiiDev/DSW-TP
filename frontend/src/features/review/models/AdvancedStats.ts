// Modelo de las estadísticas avanzadas de un usuario: "Tu año en música".
//
// Salen de GET /api/reviews/stats/me y son el beneficio que desbloquea Pro (CUU 4).
// Todo se calcula a partir de las reseñas publicadas del usuario en ese año.

/** Forma cruda con la que viajan las estadísticas en la API (snake_case). */
export type AdvancedStatsApiResponse = {
  year: number;
  available_years: number[];
  summary: {
    reviews: number;
    albums: number;
    songs: number;
    artists: number;
    genres: number;
    average_rating: number;
    written_reviews: number;
    minutes: number;
  };
  monthly: { month: number; reviews: number; average_rating: number }[];
  top_genres: { id_genre: number | null; name: string; count: number; percentage: number }[];
  top_artists: {
    id_artist: number;
    name: string;
    count: number;
    average_rating: number;
    url_cover: string | null;
  }[];
  top_albums: {
    id_album: number;
    title: string;
    artist: string | null;
    url_cover: string | null;
    rating: number;
  }[];
  decades: { decade: number; count: number }[];
  distribution: number[];
  highlights: {
    most_active_month: number | null;
    favorite_genre: string | null;
    most_common_rating: number | null;
  };
};

/** Totales del año. */
export type StatsSummary = {
  reviews: number;
  albums: number;
  songs: number;
  artists: number;
  genres: number;
  averageRating: number;
  writtenReviews: number;
  minutes: number;
};

export type MonthlyActivity = { month: number; reviews: number; averageRating: number };

/** Un género del ranking. `id` es null en el agregado "Otros". */
export type GenreShare = { id: number | null; name: string; count: number; percentage: number };

export type TopArtist = {
  id: number;
  name: string;
  count: number;
  averageRating: number;
  coverUrl: string | null;
};

export type TopAlbum = {
  id: number;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  rating: number;
};

export type DecadeCount = { decade: number; count: number };

/** Nombres cortos de los meses, en el orden en que llegan de la API. */
export const MONTH_SHORT_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export class AdvancedStats {
  constructor(
    public readonly year: number,
    public readonly availableYears: number[],
    public readonly summary: StatsSummary,
    public readonly monthly: MonthlyActivity[],
    public readonly topGenres: GenreShare[],
    public readonly topArtists: TopArtist[],
    public readonly topAlbums: TopAlbum[],
    public readonly decades: DecadeCount[],
    /** Diez posiciones, de 0,5 a 5 estrellas: lo que dibuja RatingHistogram. */
    public readonly distribution: number[],
    /** Mes con más reseñas, de 1 a 12, o null si no hay reseñas. */
    public readonly mostActiveMonth: number | null,
    public readonly favoriteGenre: string | null,
    public readonly mostCommonRating: number | null
  ) {}

  /** ¿Hay algo para graficar? Sin reseñas en el año, se muestra un vacío. */
  get hasData(): boolean {
    return this.summary.reviews > 0;
  }

  /**
   * Horas de música calificada, con un decimal. El dato estrella del resumen se
   * muestra en horas cuando pasa de una: "3.618 minutos" se lee peor que "60,3 horas".
   */
  get hours(): number {
    return Math.round((this.summary.minutes / 60) * 10) / 10;
  }

  /** Nombre del mes más activo ("Marzo"), o null. */
  get mostActiveMonthName(): string | null {
    return this.mostActiveMonth === null ? null : MONTH_NAMES[this.mostActiveMonth - 1];
  }
}
