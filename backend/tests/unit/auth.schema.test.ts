// Test unitario de los schemas de autenticación (Santino Gallo).
//
// Prueba las reglas de validación del registro y del login sin tocar la base ni
// levantar el servidor: los schemas de Zod son funciones puras, así que alcanza
// con pasarles un objeto y mirar qué devuelven.
import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../../src/features/auth/auth.schema';

// Datos válidos de base. Cada caso parte de acá y rompe un solo campo, así queda
// claro qué es lo que se está probando.
const validRegister = {
  username: 'ana.garcia',
  email: 'ana@mail.com',
  password: 'Secreta123',
};

describe('registerSchema', () => {
  it('normaliza el email: le saca los espacios y lo pasa a minúsculas', () => {
    const result = registerSchema.safeParse({ ...validRegister, email: '  Ana@Mail.COM  ' });

    expect(result.success).toBe(true);
    // El schema encadena trim() y toLowerCase() ANTES de validar el formato, así
    // que un email copiado y pegado con espacios entra igual, ya normalizado.
    expect(result.data?.email).toBe('ana@mail.com');
  });

  it('rechaza un nombre de usuario con espacios', () => {
    const result = registerSchema.safeParse({ ...validRegister, username: 'ana garcia' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('letras, números, puntos y guiones bajos');
  });

  it('rechaza una contraseña de menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({ ...validRegister, password: 'corta7x' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('al menos 8 caracteres');
  });
});

describe('loginSchema', () => {
  it('acepta una contraseña corta', () => {
    // A propósito el login no aplica el mínimo de 8 caracteres del registro: la
    // contraseña ya existe y solo hay que compararla. Validar el largo acá le
    // daría pistas a un atacante sobre el formato esperado.
    const result = loginSchema.safeParse({ email: 'ana@mail.com', password: 'abc' });

    expect(result.success).toBe(true);
  });

  it('rechaza un email con formato inválido', () => {
    const result = loginSchema.safeParse({ email: 'ana-arroba-mail', password: 'Secreta123' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El email no tiene un formato válido.');
  });
});
