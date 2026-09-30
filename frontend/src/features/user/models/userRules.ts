// Reglas de validación de los datos de una cuenta: nombre de usuario, email,
// contraseña e imágenes de perfil.
//
// Las usan tres formularios: el registro (AuthModal), el alta de usuarios del
// panel (CreateUserForm) y la edición del perfil (UserForm). Viven acá para que
// una regla se cambie en un solo lugar y los tres pidan siempre lo mismo.
//
// Copian los schemas de Zod del backend (auth.schema.ts y user.schema.ts), con
// los mismos mensajes: si el backend cambia una regla, hay que cambiarla acá.
import {
  isEmail,
  isUrl,
  matchesPattern,
  maxLength,
  minLength,
  required,
} from '../../../core/utils/validators';
import type { Rule } from '../../../core/utils/validators';

export const USERNAME_RULES: Rule[] = [
  required('Ingresá un nombre de usuario.'),
  minLength(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  maxLength(50, 'El nombre de usuario no puede tener más de 50 caracteres.'),
  matchesPattern(
    /^[a-zA-Z0-9._]+$/,
    'El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.'
  ),
];

export const EMAIL_RULES: Rule[] = [required('Ingresá un email.'), isEmail()];

/**
 * Contraseña de una cuenta NUEVA: el registro y el alta del panel. En el login
 * no se usan: ahí la contraseña ya existe y solo se compara.
 */
export const NEW_PASSWORD_RULES: Rule[] = [
  required('Ingresá una contraseña.'),
  minLength(8, 'La contraseña debe tener al menos 8 caracteres.'),
  maxLength(72, 'La contraseña no puede tener más de 72 caracteres.'),
];

/** Foto de perfil o banner: opcionales, pero si se cargan tienen que ser una URL. */
export const IMAGE_URL_RULES: Rule[] = [
  maxLength(500, 'La URL de la imagen no puede tener más de 500 caracteres.'),
  isUrl('La URL de la imagen no es válida.'),
];
