// Schemas de Zod para validar la entrada de los endpoints del CRUD de géneros.
// Los usa el middleware validate() en genre.routes.ts, antes del controller.
import { z } from 'zod';

// Regla del nombre definida una sola vez: la comparten el alta y la edición.
// El máximo acompaña al STRING(60) de la columna: si no, el error lo terminaría
// tirando MySQL y con un mensaje que no le sirve al usuario.
const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del género no puede estar vacío.')
  .max(60, 'El nombre del género no puede tener más de 60 caracteres.');

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const genreIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// Alta de un género (POST /api/genres).
export const createGenreSchema = z.object({
  name: nameSchema,
});

// A diferencia de la edición de artista, acá el nombre es obligatorio y no hay
// refine: el género tiene un solo campo editable, así que un PATCH sin nombre no
// pediría ningún cambio.
export const updateGenreSchema = z.object({
  name: nameSchema,
});

// Filtros del listado (GET /api/genres?name=rock).
export const listGenresQuerySchema = z.object({
  name: z
    .string()
    .trim()
    .max(60, 'El nombre a buscar no puede tener más de 60 caracteres.')
    // Un ?name= vacío significa "sin filtro", no un nombre inválido: es lo que
    // manda el buscador del frontend cuando el usuario borra lo que escribió.
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
});

export type GenreIdParam = z.infer<typeof genreIdParamSchema>;
export type CreateGenreInput = z.infer<typeof createGenreSchema>;
export type UpdateGenreInput = z.infer<typeof updateGenreSchema>;
export type ListGenresQuery = z.infer<typeof listGenresQuerySchema>;
