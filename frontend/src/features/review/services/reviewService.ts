// Servicio del CRUD de reseñas: centraliza las llamadas HTTP de /api/reviews y
// mapea la respuesta cruda del backend al modelo Review.
import { httpClient } from '../../../core/services/httpClient';
import {
  Review,
  ReviewAlbumRef,
  ReviewAuthor,
  ReviewComment,
  ReviewSongRef,
  ReviewStats,
} from '../models/Review';
import type {
  ReviewAlbumApiResponse,
  ReviewApiResponse,
  ReviewCommentApiResponse,
  ReviewStatsApiResponse,
  ReviewState,
  ReviewTargetKind,
  ReviewUserApiResponse,
} from '../models/Review';

/** El ítem que se está reseñando o consultando. */
export type ReviewTarget = {
  kind: ReviewTargetKind;
  id: number;
};

/** Campos que acepta el alta y la edición de una reseña. */
export type ReviewInput = {
  rating: number;
  /** null para "sin texto": es lo que se manda cuando se califica sin escribir. */
  textReview: string | null;
};

/** Filtros del listado. Sin ninguno, trae las reseñas más recientes del sitio. */
export type ReviewFilters = {
  target?: ReviewTarget;
  /**
   * Deja solo las reseñas de álbum, o solo las de canción, sin decir de cuál. Es
   * lo que consumen las pestañas "Álbumes" y "Canciones" del perfil. No se usa
   * junto con `target`, que apunta a un ítem puntual.
   */
  targetKind?: ReviewTargetKind;
  /** Solo las reseñas de un usuario. Es lo que consume el listado del perfil. */
  userId?: number;
  /** Solo un ADMIN puede pedir un estado distinto de 'published'. */
  state?: ReviewState;
  /** Filtro por estrellas: deja las de esta calificación para arriba. */
  minRating?: number;
  limit?: number;
  offset?: number;
};

/**
 * Pasa un álbum del JSON de la API al modelo.
 * @param data álbum crudo, tal como viaja dentro de una reseña.
 */
function toAlbumRef(data: ReviewAlbumApiResponse): ReviewAlbumRef {
  return new ReviewAlbumRef(
    data.id_album,
    data.title,
    data.url_cover,
    data.artist ? data.artist.name : null
  );
}

/**
 * Pasa el autor de una reseña o de un comentario del JSON al modelo.
 * @param data usuario crudo, o null si la respuesta no lo trajo.
 */
function toAuthor(data: ReviewUserApiResponse | null): ReviewAuthor | null {
  return data === null ? null : new ReviewAuthor(data.id_user, data.username, data.url_avatar);
}

/**
 * Pasa una reseña del JSON de la API al modelo.
 * @param data reseña cruda tal como la devuelve el backend.
 */
function toReview(data: ReviewApiResponse): Review {
  return new Review(
    data.id_review,
    // El backend ya lo manda como número, pero el Number() deja el modelo a salvo
    // de que un DECIMAL vuelva como string en alguna respuesta.
    Number(data.rating),
    data.text_review,
    new Date(data.review_date),
    data.edited_date === null ? null : new Date(data.edited_date),
    data.state,
    toAuthor(data.user),
    data.album ? toAlbumRef(data.album) : null,
    data.song
      ? new ReviewSongRef(
          data.song.id_song,
          data.song.song_title,
          data.song.number_track,
          data.song.album ? toAlbumRef(data.song.album) : null
        )
      : null,
    data.likes_count,
    data.liked_by_me,
    data.comments_count
  );
}

/**
 * Pasa un comentario del JSON de la API al modelo.
 * @param data comentario crudo tal como lo devuelve el backend.
 */
function toComment(data: ReviewCommentApiResponse): ReviewComment {
  return new ReviewComment(
    data.id_comment,
    data.text_comment,
    new Date(data.comment_date),
    data.id_review,
    toAuthor(data.user)
  );
}

/**
 * Traduce el ítem al par de parámetros que espera la API.
 * @param target el álbum o la canción.
 */
function targetParams(target: ReviewTarget): Record<string, number> {
  return target.kind === 'album' ? { id_album: target.id } : { id_song: target.id };
}

/**
 * Arma el query string del listado salteando los filtros vacíos.
 * @param filters ítem, autor, estado, calificación mínima y paginado.
 * @returns algo como '?id_album=5&limit=10', o '' si no hay filtros.
 */
function buildQuery(filters: ReviewFilters): string {
  const params = new URLSearchParams();

  if (filters.target) {
    const [key, value] = Object.entries(targetParams(filters.target))[0];
    params.set(key, String(value));
  }

  if (filters.targetKind) params.set('target', filters.targetKind);
  if (filters.userId !== undefined) params.set('id_user', String(filters.userId));
  if (filters.state) params.set('state', filters.state);
  if (filters.minRating !== undefined) params.set('min_rating', String(filters.minRating));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const reviewService = {
  /** Lista reseñas filtradas y paginadas. Pide sesión. */
  async list(filters: ReviewFilters = {}): Promise<Review[]> {
    const data = await httpClient.get<ReviewApiResponse[]>(`/reviews${buildQuery(filters)}`);
    return data.map(toReview);
  },

  /**
   * La reseña propia sobre un ítem, o null si todavía no lo reseñó.
   * Es lo que decide si el botón dice "Escribir reseña" o "Editar mi reseña".
   */
  async getMine(target: ReviewTarget): Promise<Review | null> {
    const data = await httpClient.get<ReviewApiResponse | null>(
      `/reviews/mine${buildQuery({ target })}`
    );
    return data === null ? null : toReview(data);
  },

  /**
   * Trae una reseña puntual: es lo que muestra su página de detalle.
   *
   * La lectura es pública, así que también funciona sin sesión (es el destino del
   * enlace de "compartir"). Si hay token, el backend lo aprovecha: devuelve el
   * "me gusta" propio ya marcado, y deja ver la reseña aunque esté oculta cuando
   * el que mira es su autor o un ADMIN.
   */
  async getById(id: number): Promise<Review> {
    const data = await httpClient.get<ReviewApiResponse>(`/reviews/${id}`);
    return toReview(data);
  },

  /**
   * Publica una reseña. El backend responde 409 si ese usuario ya reseñó el ítem.
   * @param target el álbum o la canción a reseñar.
   * @param input calificación y texto.
   */
  async create(target: ReviewTarget, input: ReviewInput): Promise<Review> {
    const data = await httpClient.post<ReviewApiResponse>('/reviews', {
      rating: input.rating,
      text_review: input.textReview,
      ...targetParams(target),
    });
    return toReview(data);
  },

  /** Edita la calificación y el texto. El backend lo restringe al autor. */
  async update(id: number, input: ReviewInput): Promise<Review> {
    const data = await httpClient.patch<ReviewApiResponse>(`/reviews/${id}`, {
      rating: input.rating,
      text_review: input.textReview,
    });
    return toReview(data);
  },

  /** Elimina una reseña. El backend lo restringe a su autor o a un ADMIN. */
  async remove(id: number): Promise<void> {
    await httpClient.delete<null>(`/reviews/${id}`);
  },

  /** Oculta una reseña. El backend lo restringe a ADMIN. */
  async hide(id: number): Promise<Review> {
    const data = await httpClient.patch<ReviewApiResponse>(`/reviews/${id}/hide`);
    return toReview(data);
  },

  /** Vuelve a publicar una reseña oculta. El backend lo restringe a ADMIN. */
  async restore(id: number): Promise<Review> {
    const data = await httpClient.patch<ReviewApiResponse>(`/reviews/${id}/restore`);
    return toReview(data);
  },

  /**
   * Pone o saca el "me gusta" del usuario logueado.
   *
   * Es una sola llamada para las dos cosas porque el corazón es un interruptor:
   * el frontend no tiene que saber en qué estado está para poder apretarlo.
   *
   * @returns la reseña con el conteo y el `likedByMe` ya actualizados.
   */
  async toggleLike(id: number): Promise<Review> {
    const data = await httpClient.post<ReviewApiResponse>(`/reviews/${id}/like`);
    return toReview(data);
  },

  /** Hilo de comentarios de una reseña, del más viejo al más nuevo. */
  async listComments(reviewId: number): Promise<ReviewComment[]> {
    const data = await httpClient.get<ReviewCommentApiResponse[]>(`/reviews/${reviewId}/comments`);
    return data.map(toComment);
  },

  /** Comenta una reseña. Cualquier usuario registrado puede. */
  async addComment(reviewId: number, text: string): Promise<ReviewComment> {
    const data = await httpClient.post<ReviewCommentApiResponse>(
      `/reviews/${reviewId}/comments`,
      { text_comment: text }
    );
    return toComment(data);
  },

  /** Borra un comentario. El backend lo restringe a su autor o a un ADMIN. */
  async removeComment(reviewId: number, commentId: number): Promise<void> {
    await httpClient.delete<null>(`/reviews/${reviewId}/comments/${commentId}`);
  },

  /**
   * Estadísticas de las reseñas de un usuario: el total, la distribución por
   * estrellas y cuántos álbumes y canciones calificó.
   *
   * Va aparte del listado porque el listado está paginado: con una tanda de cinco
   * reseñas no se puede calcular la distribución de las cuarenta que tiene.
   */
  async stats(userId: number): Promise<ReviewStats> {
    const data = await httpClient.get<ReviewStatsApiResponse>(`/reviews/stats?id_user=${userId}`);
    return new ReviewStats(data.total, data.distribution, data.albums, data.songs);
  },
};
