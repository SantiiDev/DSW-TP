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

// GET /api/users/ranking
//
// No lleva orden: el ranking es uno solo y combina las dos señales de actividad
// en un puntaje (ver ACTIVITY_SCORE en follow.repository.ts). Tampoco lleva
// offset, igual que las sugerencias: es un panel de la columna lateral de
// /reviews, no un listado del padrón.
const DEFAULT_RANKING_LIMIT = 5;
const MAX_RANKING_LIMIT = 20;

export const rankingQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_RANKING_LIMIT, `El tope no puede ser mayor a ${MAX_RANKING_LIMIT}.`)
    .default(DEFAULT_RANKING_LIMIT),
});

// GET /api/users/search?q=gar
//
// El texto se recorta antes de validar: "  " no es una búsqueda, y sin el trim
// pasaría el mínimo de un carácter y traería a todos los usuarios.
const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 20;

export const searchUsersQuerySchema = z.object({
  q: z
    .string({ error: 'Escribí el nombre de usuario que buscás.' })
    .trim()
    .min(1, 'Escribí el nombre de usuario que buscás.')
    .max(50, 'La búsqueda no puede superar los 50 caracteres.'),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_SEARCH_LIMIT, `El tope no puede ser mayor a ${MAX_SEARCH_LIMIT}.`)
    .default(DEFAULT_SEARCH_LIMIT),
});

// GET /api/users/:id/followers y /following
//
// Estas sí paginan, a diferencia de las sugerencias: alguien puede seguir a
// cientos de personas, y la lista se va cargando de a tandas con "Cargar más".
const DEFAULT_FOLLOW_LIST_LIMIT = 20;
const MAX_FOLLOW_LIST_LIMIT = 50;

export const followListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_FOLLOW_LIST_LIMIT, `El tope no puede ser mayor a ${MAX_FOLLOW_LIST_LIMIT}.`)
    .default(DEFAULT_FOLLOW_LIST_LIMIT),
  offset: z.coerce.number().int().min(0, 'El desplazamiento no puede ser negativo.').default(0),
});

export type FollowParams = z.infer<typeof followParamsSchema>;
export type SuggestedUsersQuery = z.infer<typeof suggestedUsersQuerySchema>;
export type RankingQuery = z.infer<typeof rankingQuerySchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type FollowListQuery = z.infer<typeof followListQuerySchema>;
