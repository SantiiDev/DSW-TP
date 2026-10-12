// Test unitario del schema del ranking de usuarios más activos.
//
// Prueba el valor por defecto y el tope del listado: son las reglas que hacen
// que un query string incompleto o inventado no llegue nunca al repositorio.
import { describe, expect, it } from 'vitest';
import { rankingQuerySchema } from '../../src/features/follow/follow.schema';

describe('rankingQuerySchema', () => {
  it('trae cinco usuarios cuando no se pide un tope', () => {
    // El panel pide /users/ranking sin parámetros.
    const result = rankingQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(5);
  });

  it('convierte el limit del query string, que siempre llega como texto', () => {
    const result = rankingQuerySchema.safeParse({ limit: '10' });

    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(10);
  });

  it('no deja pedir más de 20 usuarios', () => {
    // El tope evita que alguien use el ranking para bajarse el padrón entero.
    const result = rankingQuerySchema.safeParse({ limit: 500 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El tope no puede ser mayor a 20.');
  });

  it('rechaza un tope de cero', () => {
    const result = rankingQuerySchema.safeParse({ limit: 0 });

    expect(result.success).toBe(false);
  });
});
