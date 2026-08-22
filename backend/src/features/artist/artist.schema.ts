// Schemas de Zod para validar la entrada de los endpoints del CRUD de artistas.
// Los usa el middleware validate() en artist.routes.ts, antes del controller.
import { z } from 'zod';
import { CONTENT_STATES } from '../../shared/types/enums';

// Reglas de cada campo definidas una sola vez: las comparten el alta y la edición.
// El máximo acompaña al STRING(150) de la columna: si no, el error lo terminaría
// tirando MySQL y con un mensaje que no le sirve al usuario.
const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del artista no puede estar vacío.')
  .max(150, 'El nombre del artista no puede tener más de 150 caracteres.');

// La biografía es opcional y en la base es un TEXT que admite NULL.
// El string vacío se traduce a null en vez de rechazarse (mismo criterio que
// url_avatar en user.schema.ts): es lo que manda el formulario cuando el usuario
// borra el campo, y "sin biografía" en la base es NULL, no ''.
const biographySchema = z
  .union([
    z.literal(''),
    z.null(),
    z.string().trim().max(5000, 'La biografía no puede tener más de 5000 caracteres.'),
  ])
  .transform((value) => (value === '' ? null : value));

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const artistIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// Alta de un artista (POST /api/artists). El estado y el autor NO se reciben del
// cliente: los decide el service a partir del rol de quien hace la request.
export const createArtistSchema = z.object({
  name: nameSchema,
  biography: biographySchema.optional(),
});

// Todo opcional: PATCH permite mandar solo el campo que se quiere cambiar.
// `state` tampoco se edita por acá; para eso están /:id/approve y /:id/reject.
export const updateArtistSchema = z
  .object({
    name: nameSchema.optional(),
    biography: biographySchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Hay que enviar al menos un campo para actualizar.',
  });

// Filtros del listado (GET /api/artists?state=pending&name=nirvana).
// Solo un ADMIN puede pedir un estado distinto de 'approved': eso lo resuelve el
// service, acá únicamente se chequea que lo que llegue sea un estado válido.
export const listArtistsQuerySchema = z.object({
  state: z
    .enum(CONTENT_STATES, {
      message: `El estado debe ser uno de: ${CONTENT_STATES.join(', ')}.`,
    })
    .optional(),
  name: z
    .string()
    .trim()
    .max(150, 'El nombre a buscar no puede tener más de 150 caracteres.')
    // Un ?name= vacío significa "sin filtro", no un nombre inválido: es lo que
    // manda el buscador del frontend cuando el usuario borra lo que escribió.
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
  // Filtra por origen del artista: 'true' deja solo los aportados por usuarios y
  // 'false' solo los del catálogo inicial. Lo usa la cola de moderación, que no
  // tiene por qué mostrar los 88 artistas que cargó el seed.
  //
  // No se usa z.coerce.boolean() porque convierte cualquier texto no vacío en
  // true, y entonces ?contributed=false daría true.
  contributed: z
    .enum(['true', 'false'], { message: 'El filtro de origen debe ser true o false.' })
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  // Deja solo los aportes de un usuario puntual. Lo usa la pestaña "Aportes" del
  // perfil; el service decide qué estados de esos aportes puede ver quien pregunta.
  created_by: z.coerce
    .number()
    .int()
    .positive('El id del usuario debe ser un número positivo.')
    .optional(),
});

// Búsqueda de nombres parecidos (GET /api/artists/similar?name=Spinetta).
// A diferencia del listado, acá el nombre es obligatorio: sin nombre no hay nada
// con qué comparar.
export const similarArtistsQuerySchema = z.object({
  name: nameSchema,
  // En una edición, el artista que se está editando: su propio nombre no cuenta
  // como parecido.
  exclude_id: z.coerce.number().int().positive('El id debe ser un número positivo.').optional(),
});

export type ArtistIdParam = z.infer<typeof artistIdParamSchema>;
export type SimilarArtistsQuery = z.infer<typeof similarArtistsQuerySchema>;
export type CreateArtistInput = z.infer<typeof createArtistSchema>;
export type UpdateArtistInput = z.infer<typeof updateArtistSchema>;
export type ListArtistsQuery = z.infer<typeof listArtistsQuerySchema>;
