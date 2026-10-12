// Validación de los formularios de inicio de sesión y registro (AuthModal).
import { isEmail, required, sameAs, validateField } from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';
import { EMAIL_RULES, NEW_PASSWORD_RULES, USERNAME_RULES } from './userRules';

export type AuthFieldName = 'username' | 'email' | 'password' | 'confirmPassword';

export type AuthValues = Record<AuthFieldName, string>;

/**
 * Valida el formulario con las mismas reglas que registerSchema y loginSchema
 * del backend (auth.schema.ts), así el usuario se entera antes de mandarlo.
 *
 * En el login la contraseña solo tiene que estar: ya existe y se compara tal
 * cual, y validarle el largo daría pistas sobre el formato esperado (el backend
 * hace lo mismo).
 *
 * @param values lo que escribió el usuario.
 * @param isLogin si es el formulario de inicio de sesión o el de registro.
 * @returns el mensaje de error de cada campo, o undefined si está bien.
 */
export function validateAuthForm(values: AuthValues, isLogin: boolean): FieldErrors<AuthFieldName> {
  if (isLogin) {
    return {
      email: validateField(values.email, [required('Ingresá tu email.'), isEmail()]),
      password: validateField(values.password, [required('Ingresá tu contraseña.')]),
    };
  }

  // Las reglas del registro son las de cualquier cuenta nueva (models/userRules).
  return {
    username: validateField(values.username, USERNAME_RULES),
    email: validateField(values.email, EMAIL_RULES),
    password: validateField(values.password, NEW_PASSWORD_RULES),
    confirmPassword: validateField(values.confirmPassword, [
      required('Repetí la contraseña.'),
      sameAs(values.password, 'Las contraseñas no coinciden.'),
    ]),
  };
}
