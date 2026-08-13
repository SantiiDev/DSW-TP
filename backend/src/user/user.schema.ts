// Schemas de Zod para validar la entrada de los endpoints del CRUD de usuarios.
// Los usa el middleware validate() en user.routes.ts, antes del controller.
import { z } from 'zod';

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// Mismas reglas de username/email que auth.schema.ts, pero acá todo es opcional:
// PATCH permite mandar solo el campo que se quiere cambiar. rol y password NUNCA
// se editan por acá: rol se maneja desde membership/admin, password no tiene un
// endpoint propio en este CRUD.
export const updateUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
      .max(50, 'El nombre de usuario no puede tener más de 50 caracteres.')
      .regex(
        /^[a-zA-Z0-9._]+$/,
        'El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.'
      )
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email('El email no tiene un formato válido.'))
      .optional(),
  })
  .refine((data) => data.username !== undefined || data.email !== undefined, {
    message: 'Hay que enviar al menos un campo para actualizar.',
  });

export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
