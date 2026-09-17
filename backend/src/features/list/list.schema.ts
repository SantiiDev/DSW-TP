// Schemas de Zod para validar la entrada de los endpoints del CRUD de listas.
// Los usa el middleware validate() en list.routes.ts, antes del controller.
import { z } from 'zod';

/** Criterios de orden del explorador de listas. */
export const LIST_SORTS = ['recent', 'top'] as const;
export type ListSort = (typeof LIST_SORTS)[number];

// El nombre acompaña al STRING(100) de la columna: si no, el error lo terminaría
// tirando MySQL y con un mensaje que no le sirve al usuario.
const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la lista no puede estar vacío.')
  .max(100, 'El nombre de la lista no puede tener más de 100 caracteres.');

// La descripción es opcional: se puede armar una lista solo con el nombre. El
// string vacío se traduce a null, mismo criterio que text_review en
// review.schema.ts: es lo que manda el formulario cuando se deja el campo en blanco.
const descriptionSchema = z
  .union([
    z.literal(''),
    z.null(),
    z
      .string()
      .trim()
      .max(500, 'La descripción no puede tener más de 500 caracteres.'),
  ])
  .transform((value) => (value === '' || value === null ? null : value));

// Cuántas listas devuelve una tanda del explorador y cuántas puede pedir como
// máximo una sola request. Igual criterio que el resto de la API: sin envelope,
// el botón "Ver más" se muestra mientras la última tanda haya vuelto completa.
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const listIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// El :id de la lista más el :idAlbum de una ruta anidada
// (DELETE /api/lists/:id/albums/:idAlbum).
export const listAlbumParamsSchema = z.object({
  id: z.coerce.number().int().positive('El id de la lista debe ser un número positivo.'),
  idAlbum: z.coerce.number().int().positive('El id del álbum debe ser un número positivo.'),
});

// Tope de álbumes que se pueden mandar en el alta. No es un límite del modelo
// (después se agregan de a uno sin tope): es para que una sola request no
// dispare cientos de inserciones.
const MAX_ALBUMS_ON_CREATE = 50;

const albumIdSchema = z.coerce
  .number()
  .int()
  .positive('El id del álbum debe ser un número positivo.');

// Alta de una lista (POST /api/lists). El autor NO se recibe del cliente: sale
// del token.
//
// `album_ids` es OBLIGATORIO y con al menos un elemento: una lista vacía no es
// una agrupación de álbumes, es un nombre suelto. La regla vive acá y no solo en
// el formulario porque la validación real del sistema es siempre la del backend.
export const createListSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  album_ids: z
    .array(albumIdSchema, { error: 'Hay que elegir al menos un álbum para la lista.' })
    .min(1, 'Una lista tiene que tener al menos un álbum.')
    .max(MAX_ALBUMS_ON_CREATE, `No se pueden agregar más de ${MAX_ALBUMS_ON_CREATE} álbumes de una vez.`)
    // Sin esto, mandar dos veces el mismo álbum chocaría contra la PK compuesta
    // de LIST_ALBUMS y la request terminaría en un 500 de MySQL.
    .transform((ids) => [...new Set(ids)]),
});

// Edición (PATCH /api/lists/:id). Los álbumes no se tocan por acá: para eso están
// los endpoints anidados /:id/albums, que agregan o sacan de a uno.
export const updateListSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Hay que enviar al menos un campo para actualizar.',
  });

// Filtros del explorador (GET /api/lists?genre=3&sort=top).
export const listListsQuerySchema = z.object({
  // Deja solo las listas que tengan al menos un álbum de ese género. Es el
  // filtro de los chips de la barra lateral de /lists.
  genre: z.coerce.number().int().positive('El id del género debe ser un número positivo.').optional(),
  // Búsqueda parcial por nombre.
  q: z
    .string()
    .trim()
    .max(100, 'El texto a buscar no puede tener más de 100 caracteres.')
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
  id_user: z.coerce.number().int().positive('El id del usuario debe ser un número positivo.').optional(),
  // 'recent' (la sección "Listas en Tendencia") o 'top' (por cantidad de "me
  // gusta", la sección "Top Listas"). Sin filtro, recent.
  sort: z
    .enum(LIST_SORTS, { message: `El orden debe ser uno de: ${LIST_SORTS.join(', ')}.` })
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_LIMIT, `El tope no puede ser mayor a ${MAX_LIMIT}.`)
    .default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0, 'El desde no puede ser negativo.').default(0),
});

// Agregar un álbum a una lista (POST /api/lists/:id/albums).
export const addAlbumToListSchema = z.object({
  id_album: z.coerce.number().int().positive('El id del álbum debe ser un número positivo.'),
});

export type ListIdParam = z.infer<typeof listIdParamSchema>;
export type ListAlbumParams = z.infer<typeof listAlbumParamsSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ListListsQuery = z.infer<typeof listListsQuerySchema>;
export type AddAlbumToListInput = z.infer<typeof addAlbumToListSchema>;
