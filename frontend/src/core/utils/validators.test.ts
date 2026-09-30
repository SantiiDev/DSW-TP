// Test unitario de las reglas de validación de formularios.
//
// Son funciones puras: reciben un texto y devuelven un mensaje o null, así que se
// prueban sin montar ningún componente.
import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  isEmail,
  isIntegerBetween,
  isNumberBetween,
  isUrl,
  matchesPattern,
  maxLength,
  minLength,
  required,
  sameAs,
  validateField,
} from './validators';

describe('reglas sueltas', () => {
  it('required rechaza un campo vacío o con solo espacios', () => {
    expect(required('Falta')('')).toBe('Falta');
    expect(required('Falta')('   ')).toBe('Falta');
    expect(required('Falta')('hola')).toBeNull();
  });

  it('isEmail acepta un email común y rechaza uno sin dominio', () => {
    expect(isEmail()('ana@correo.com')).toBeNull();
    expect(isEmail()('ana@correo')).toBe('El email no tiene un formato válido.');
    expect(isEmail()('ana correo@x.com')).not.toBeNull();
  });

  it('minLength y maxLength miden sin los espacios de los extremos', () => {
    expect(minLength(3, 'Corto')('  ab  ')).toBe('Corto');
    expect(minLength(3, 'Corto')('abc')).toBeNull();
    expect(maxLength(3, 'Largo')(' abc ')).toBeNull();
    expect(maxLength(3, 'Largo')('abcd')).toBe('Largo');
  });

  it('matchesPattern aplica la regla de caracteres del nombre de usuario', () => {
    const username = matchesPattern(/^[a-zA-Z0-9._]+$/, 'Caracteres inválidos');

    expect(username('ana.perez_1')).toBeNull();
    expect(username('Ana Pérez')).toBe('Caracteres inválidos');
  });

  it('sameAs compara el valor exacto, sin recortar', () => {
    expect(sameAs('clave123', 'No coinciden')('clave123')).toBeNull();
    expect(sameAs('clave123', 'No coinciden')('clave124')).toBe('No coinciden');
  });

  it('isNumberBetween acepta coma decimal y rechaza lo que no es número', () => {
    const amount = isNumberBetween(0, 1000, 'Monto inválido');

    expect(amount('750,5')).toBeNull();
    expect(amount('abc')).toBe('Monto inválido');
    expect(amount('-1')).toBe('Monto inválido');
  });

  it('isUrl acepta http y https, y rechaza texto suelto u otros protocolos', () => {
    const url = isUrl('URL inválida');

    expect(url('https://picsum.photos/200')).toBeNull();
    expect(url('http://ejemplo.com/foto.jpg')).toBeNull();
    expect(url('picsum.photos/200')).toBe('URL inválida');
    expect(url('javascript:alert(1)')).toBe('URL inválida');
  });

  it('isIntegerBetween rechaza decimales, letras y valores fuera de rango', () => {
    const year = isIntegerBetween(1900, 2100, 'Año inválido');

    expect(year('1999')).toBeNull();
    expect(year('1999.5')).toBe('Año inválido');
    expect(year('19a9')).toBe('Año inválido');
    expect(year('1800')).toBe('Año inválido');
  });

  it('las reglas de formato dejan pasar el vacío: eso lo decide required', () => {
    expect(isEmail()('')).toBeNull();
    expect(minLength(8, 'Corto')('')).toBeNull();
    expect(isNumberBetween(0, 10, 'Mal')('')).toBeNull();
  });
});

describe('validateField', () => {
  it('devuelve solo el primer error, en el orden de las reglas', () => {
    const rules = [required('Ingresá tu email.'), isEmail()];

    expect(validateField('', rules)).toBe('Ingresá tu email.');
    expect(validateField('mal', rules)).toBe('El email no tiene un formato válido.');
    expect(validateField('ana@correo.com', rules)).toBeUndefined();
  });
});

describe('hasErrors', () => {
  it('ignora los campos válidos, que quedan en undefined', () => {
    expect(hasErrors({ email: undefined, password: undefined })).toBe(false);
    expect(hasErrors({ email: undefined, password: 'Falta' })).toBe(true);
  });
});
