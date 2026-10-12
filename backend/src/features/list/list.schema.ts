// Schemas de Zod para validar la entrada de los endpoints del CRUD de listas.
// Los usa el middleware validate() en list.routes.ts, antes del controller.
import { z } from 'zod';
import { LIST_TYPES } from '../../shared/types/enums';

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

// De qué es la lista. Es obligatorio en el alta y NO se puede cambiar después:
// ver updateListSchema.
const typeSchema = z.enum(LIST_TYPES, {
  message: 'Una lista tiene que ser de álbumes o de canciones.',
});

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

// El :id de la lista más el :idItem de una ruta anidada
// (DELETE /api/lists/:id/items/:idItem). Qué es ese ítem —un álbum o una
// canción— no lo dice la URL: lo dice el `type` de la lista.
export const listItemParamsSchema = z.object({
  id: z.coerce.number().int().positive('El id de la lista debe ser un número positivo.'),
  idItem: z.coerce.number().int().positive('El id del ítem debe ser un número positivo.'),
});

// Tope de ítems que se pueden mandar en el alta. No es un límite del modelo
// (después se agregan de a uno sin tope): es para que una sola request no
// dispare cientos de inserciones.
const MAX_ITEMS_ON_CREATE = 50;

const itemIdSchema = z.coerce
  .number()
  .int()
  .positive('El id del ítem debe ser un número positivo.');

// Alta de una lista (POST /api/lists). El autor NO se recibe del cliente: sale
// del token.
//
// `item_ids` es OBLIGATORIO y con al menos un elemento: una lista vacía no es
// una agrupación, es un nombre suelto. La regla vive acá y no solo en el
// formulario porque la validación real del sistema es siempre la del backend.
//
// Qué son esos ids —álbumes o canciones— lo decide `type`, y por eso el campo no
// se llama `album_ids` ni `song_ids`: es el mismo campo con los dos tipos de
// lista, igual que la ruta anidada de ítems.
export const createListSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  type: typeSchema,
  item_ids: z
    .array(itemIdSchema, { error: 'Hay que elegir al menos un ítem para la lista.' })
    .min(1, 'Una lista tiene que tener al menos un álbum o una canción.')
    .max(MAX_ITEMS_ON_CREATE, `No se pueden agregar más de ${MAX_ITEMS_ON_CREATE} ítems de una vez.`)
    // Sin esto, mandar dos veces el mismo ítem chocaría contra la PK compuesta
    // de la tabla intermedia y la request terminaría en un 500 de MySQL.
    .transform((ids) => [...new Set(ids)]),
});

// Edición (PATCH /api/lists/:id). Los ítems no se tocan por acá: para eso están
// los endpoints anidados /:id/items, que agregan o sacan de a uno.
//
// `type` tampoco se acepta, y no es un olvido: cambiarle el tipo a una lista con
// ítems adentro obligaría a vaciarla primero, porque sus filas viven en la tabla
// intermedia del tipo viejo. Quien quiera una lista del otro tipo, arma otra.
export const updateListSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Hay que enviar al menos un campo para actualizar.',
  });

// Filtros del explorador (GET /api/lists?genre=3&sort=top&type=song).
export const listListsQuerySchema = z.object({
  // Deja solo las listas que tengan al menos un ítem de ese género. Es el
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
  // Solo listas de álbumes o solo de canciones. Sin el filtro vienen las dos,
  // que es lo que necesita "Más listas de @usuario".
  type: typeSchema.optional(),
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

// Agregar un ítem a una lista (POST /api/lists/:id/items).
export const addItemToListSchema = z.object({
  id_item: z.coerce.number().int().positive('El id del ítem debe ser un número positivo.'),
});

export type ListIdParam = z.infer<typeof listIdParamSchema>;
export type ListItemParams = z.infer<typeof listItemParamsSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ListListsQuery = z.infer<typeof listListsQuerySchema>;
export type AddItemToListInput = z.infer<typeof addItemToListSchema>;
