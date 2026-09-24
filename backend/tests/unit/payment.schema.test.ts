// Test unitario del schema de las métricas del dashboard de administración
// (Santino Gallo).
//
// El año llega por query string, así que siempre es texto: el schema tiene que
// convertirlo a número y rechazar lo que no sea un año razonable antes de que
// llegue al service, que lo usa para filtrar los pagos.
import { describe, expect, it } from 'vitest';
import { paymentStatsQuerySchema } from '../../src/features/payment/payment.schema';

describe('paymentStatsQuerySchema', () => {
  it('acepta la query sin año: el service usa el año en curso', () => {
    const result = paymentStatsQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.year).toBeUndefined();
  });

  it('convierte a número el año que llega como texto', () => {
    const result = paymentStatsQuerySchema.safeParse({ year: '2026' });

    expect(result.success).toBe(true);
    expect(result.data?.year).toBe(2026);
  });

  it('rechaza un año que no es un número', () => {
    const result = paymentStatsQuerySchema.safeParse({ year: 'abc' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El año tiene que ser un número.');
  });

  it('rechaza un año con decimales', () => {
    const result = paymentStatsQuerySchema.safeParse({ year: '2026.5' });

    expect(result.success).toBe(false);
  });

  it('rechaza un año fuera de rango', () => {
    expect(paymentStatsQuerySchema.safeParse({ year: '1800' }).success).toBe(false);
    expect(paymentStatsQuerySchema.safeParse({ year: '3000' }).success).toBe(false);
  });
});
