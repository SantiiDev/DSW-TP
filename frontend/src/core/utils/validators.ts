// Validaciones de formularios hechas por nosotros, en vez de las del navegador.
//
// Los atributos nativos (required, type="email", minLength) muestran un globo
// genérico que no sigue el estilo del sitio, cambia según el navegador y no deja
// explicar la regla ("solo letras, números, puntos y guiones bajos"). Por eso los
// formularios llevan noValidate y validan con estas funciones.
//
// Cada regla es una función que recibe el valor y devuelve el mensaje de error, o
// null si el valor está bien. validateField corre las reglas de un campo en orden
// y se queda con el primer error: así el usuario ve un problema por vez.
//
//   validateField(email, [required('Ingresá tu email.'), isEmail()])
//
// Las reglas y los mensajes copian los schemas de Zod del backend. El backend
// sigue validando igual (es la validación que vale): esta solo avisa antes de
// gastar una request.

/** Una regla de validación: el mensaje de error, o null si el valor es válido. */
export type Rule = (value: string) => string | null;

/** Errores de un formulario: un mensaje por campo, solo en los que fallan. */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

/**
 * Formato de email: algo@algo.algo, sin espacios. No pretende cubrir todo lo que
 * permite el estándar; alcanza para atrapar los errores de tipeo comunes, y el
 * backend (z.email) tiene la última palabra.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El campo no puede quedar vacío (los espacios solos cuentan como vacío). */
export const required =
  (message: string): Rule =>
  (value) =>
    value.trim() === '' ? message : null;

/** El valor tiene formato de email. Un campo vacío lo resuelve `required`. */
export const isEmail =
  (message = 'El email no tiene un formato válido.'): Rule =>
  (value) =>
    value.trim() === '' || EMAIL_PATTERN.test(value.trim()) ? null : message;

/** Al menos `min` caracteres, sin contar los espacios de los extremos. */
export const minLength =
  (min: number, message: string): Rule =>
  (value) =>
    value.trim() === '' || value.trim().length >= min ? null : message;

/** Como mucho `max` caracteres. */
export const maxLength =
  (max: number, message: string): Rule =>
  (value) =>
    value.trim().length <= max ? null : message;

/** El valor cumple una expresión regular (por ejemplo, los caracteres permitidos). */
export const matchesPattern =
  (pattern: RegExp, message: string): Rule =>
  (value) =>
    value.trim() === '' || pattern.test(value.trim()) ? null : message;

/** El valor es igual a otro (confirmar contraseña). */
export const sameAs =
  (other: string, message: string): Rule =>
  (value) =>
    value === other ? null : message;

/**
 * El valor es un número entre `min` y `max`. Acepta coma o punto decimal, que
 * es como se escribe un monto en Argentina ("1750,50").
 */
export const isNumberBetween =
  (min: number, max: number, message: string): Rule =>
  (value) => {
    if (value.trim() === '') return null;
    const number = Number(value.trim().replace(',', '.'));
    return Number.isFinite(number) && number >= min && number <= max ? null : message;
  };

/**
 * Corre las reglas de un campo en orden.
 * @returns el primer error que encuentra, o undefined si el valor pasa todas.
 */
export function validateField(value: string, rules: Rule[]): string | undefined {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return undefined;
}

/**
 * ¿Hay algún error en el formulario? Los campos válidos quedan en undefined, así
 * que alcanza con buscar uno que tenga mensaje.
 */
export function hasErrors<Field extends string>(errors: FieldErrors<Field>): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Atributos que un control necesita cuando su campo tiene un error:
 * aria-invalid (que además pinta el borde en rojo, ver core/components/FormField/FormField.scss) y
 * aria-describedby, para que el lector de pantalla lea el mensaje al enfocarlo.
 *
 *   <TextInput id="plan-name" {...fieldErrorProps('plan-name', errors.name)} />
 *
 * @param id el mismo id que recibe FormField.
 * @param error el mensaje del campo, o undefined si está bien.
 */
export function fieldErrorProps(id: string, error: string | undefined) {
  return error
    ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` }
    : { 'aria-invalid': false as const };
}
