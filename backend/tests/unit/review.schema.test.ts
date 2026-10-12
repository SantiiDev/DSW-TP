// Test unitario del schema de alta de reseña (Santiago Siena).
//
// Prueba las dos reglas de negocio más fuertes del modelo: la escala de media
// estrella y el XOR del ítem reseñado (un álbum o una canción, nunca los dos).
import { describe, expect, it } from 'vitest';
import { createReviewSchema } from '../../src/features/review/review.schema';

describe('createReviewSchema — escala de calificación', () => {
  it('acepta una media estrella', () => {
    const result = createReviewSchema.safeParse({ rating: 4.5, id_album: 1 });

    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(4.5);
  });

  it('rechaza una calificación que no sea múltiplo de 0.5', () => {
    // La columna es DECIMAL(2,1) y la UI son diez medias estrellas: un 3.7 no se
    // podría guardar sin perder precisión ni dibujar.
    const result = createReviewSchema.safeParse({ rating: 3.7, id_album: 1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('de media en media estrella');
  });

  it('rechaza una calificación mayor a 5', () => {
    const result = createReviewSchema.safeParse({ rating: 6, id_album: 1 });

    expect(result.success).toBe(false);
  });
});

describe('createReviewSchema — ítem reseñado', () => {
  it('acepta una reseña de canción', () => {
    const result = createReviewSchema.safeParse({ rating: 5, id_song: 42 });

    expect(result.success).toBe(true);
  });

  it('rechaza una reseña que apunte al álbum y a la canción a la vez', () => {
    const result = createReviewSchema.safeParse({ rating: 4, id_album: 1, id_song: 42 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('pero no a los dos');
  });

  it('rechaza una reseña que no apunte a nada', () => {
    const result = createReviewSchema.safeParse({ rating: 4 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('un álbum o a una canción');
  });
});
