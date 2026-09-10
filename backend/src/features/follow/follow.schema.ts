// Schemas de Zod para validar la entrada de los endpoints de seguimiento.
// Los usa el middleware validate() en follow.routes.ts, antes del controller.
import { z } from 'zod';

// Cuántos usuarios devuelve el panel "Gente para seguir" si no se pide otra cosa.
// Ocho entran en la columna lateral sin obligar a scrollear.
const DEFAULT_SUGGESTIONS_LIMIT = 8;
// Tope duro: es un panel de descubrimiento, no un listado del padrón de usuarios.
const MAX_SUGGESTIONS_LIMIT = 20;

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo recibe tipado como number. Es el mismo criterio
// que en genre.schema.ts y review.schema.ts.
export const followParamsSchema = z.object({
  id: z.coerce.number().int().positive('El id del usuario debe ser un número positivo.'),
});

// GET /api/users/suggestions
//
// No lleva offset, a diferencia del listado de reseñas: el panel no pagina, es
// una recomendación corta. Para ver otros nombres se vuelve a pedir la tanda
// después de seguir a alguien, porque los ya seguidos dejan de aparecer.
export const suggestedUsersQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_SUGGESTIONS_LIMIT, `El tope no puede ser mayor a ${MAX_SUGGESTIONS_LIMIT}.`)
    .default(DEFAULT_SUGGESTIONS_LIMIT),
});

export type FollowParams = z.infer<typeof followParamsSchema>;
export type SuggestedUsersQuery = z.infer<typeof suggestedUsersQuerySchema>;
