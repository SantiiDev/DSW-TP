// Schemas de Zod para validar la entrada de los endpoints de autenticación.
// Los usa el middleware validate() en auth.routes.ts, antes del controller.
import { z } from 'zod';

// El email se normaliza ANTES de validarlo: primero se le sacan los espacios y se
// pasa a minúsculas, y recién ahí se chequea el formato. Si fuera al revés, un
// " Ana@Mail.com " copiado y pegado se rechazaría por los espacios de más.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('El email no tiene un formato válido.'));

// bcrypt solo tiene en cuenta los primeros 72 bytes de la contraseña: lo que pase
// de ahí se ignora en silencio. Se corta antes para no dar una falsa sensación de
// seguridad con contraseñas larguísimas.
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña no puede tener más de 72 caracteres.');

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
    .max(50, 'El nombre de usuario no puede tener más de 50 caracteres.')
    .regex(
      /^[a-zA-Z0-9._]+$/,
      'El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.'
    ),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  // En el login no se aplican las reglas de largo: la contraseña ya existe y solo
  // hay que compararla. Validarla acá daría pistas sobre el formato esperado.
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
