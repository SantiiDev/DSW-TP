// Schemas de Zod para validar la entrada de los endpoints del CRUD de reseñas.
// Los usa el middleware validate() en review.routes.ts, antes del controller.
import { z } from 'zod';
import { REVIEW_STATES, REVIEW_TARGETS } from '../../shared/types/enums';

// Escala de calificación de Musicboxd: de media estrella a cinco. Son los mismos
// límites que valida la entidad (ver review.entity.ts); se repiten acá para que el
// error salga como un 400 con el campo señalado, y no como una validación de
// Sequelize disparada más adelante y con un mensaje que no le sirve al usuario.
const MIN_RATING = 0.5;
const MAX_RATING = 5;

// Techo del texto. La columna es un TEXT, que aguanta mucho más, pero un límite
// explícito evita que alguien pegue un libro entero en el formulario.
const MAX_TEXT_LENGTH = 5000;

const ratingSchema = z.coerce
  .number({ error: 'Hay que elegir una calificación.' })
  .min(MIN_RATING, `La calificación mínima es ${MIN_RATING} estrellas.`)
  .max(MAX_RATING, `La calificación máxima es ${MAX_RATING} estrellas.`)
  // La columna es DECIMAL(2,1) y la UI son diez medias estrellas: un 3.7 no se
  // podría guardar sin perder precisión ni dibujar. Multiplicar por dos y pedir
  // que dé entero es la forma más directa de decir "múltiplo de 0,5".
  .refine((value) => Number.isInteger(value * 2), {
    message: 'La calificación va de media en media estrella (0.5, 1, 1.5 ... 5).',
  });

// El texto es opcional: se puede calificar sin escribir nada, que además es lo más
// común. El string vacío se traduce a null (mismo criterio que url_cover en
// album.schema.ts): es lo que manda el formulario cuando se deja el campo en blanco.
const textReviewSchema = z
  .union([
    z.literal(''),
    z.null(),
    z
      .string()
      .trim()
      .max(MAX_TEXT_LENGTH, `La reseña no puede tener más de ${MAX_TEXT_LENGTH} caracteres.`),
  ])
  .transform((value) => (value === '' || value === null ? null : value));

// Id del ítem reseñado. Sirve para las dos puntas (álbum y canción) porque en los
// dos casos es la PK de una tabla del catálogo.
const targetIdSchema = z.coerce
  .number()
  .int('El id del ítem a reseñar tiene que ser un número entero.')
  .positive('El id del ítem a reseñar debe ser un número positivo.');

// La regla del DER: una reseña es de un álbum O de una canción, nunca de las dos
// ni de ninguna. La entidad ya la valida a nivel de fila; se duplica acá para que
// el usuario reciba un 400 legible en vez de un 500 de Sequelize.
const TARGET_MESSAGE =
  'Una reseña tiene que apuntar a un álbum o a una canción, pero no a los dos.';

/** ¿Vino exactamente uno de los dos ids? El XOR de la regla de arriba. */
function hasExactlyOneTarget(data: { id_album?: number; id_song?: number }): boolean {
  return (data.id_album === undefined) !== (data.id_song === undefined);
}

// Cuántas reseñas devuelve una tanda del listado y cuántas puede pedir como máximo
// una sola request. La ficha del álbum pagina de a diez con un botón "Ver más".
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// Alta de una reseña (POST /api/reviews). El autor NO se recibe del cliente: sale
// del token. El estado tampoco: toda reseña nueva entra como 'published'.
export const createReviewSchema = z
  .object({
    rating: ratingSchema,
    text_review: textReviewSchema.optional(),
    id_album: targetIdSchema.optional(),
    id_song: targetIdSchema.optional(),
  })
  .refine(hasExactlyOneTarget, { message: TARGET_MESSAGE });

// Edición (PATCH /api/reviews/:id). Solo se cambian la calificación y el texto.
//
// `state` no se edita por acá: para eso están /:id/hide y /:id/restore, que además
// son de ADMIN. Y el ítem reseñado tampoco: mudar una reseña de un álbum a otro no
// significa nada, para eso se borra y se escribe una nueva.
export const updateReviewSchema = z
  .object({
    rating: ratingSchema.optional(),
    text_review: textReviewSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Hay que enviar al menos un campo para actualizar.',
  });

// Filtros del listado (GET /api/reviews?id_album=5&min_rating=4).
//
// Solo un ADMIN puede pedir un estado distinto de 'published': eso lo resuelve el
// service, acá únicamente se chequea que lo que llegue sea un estado válido.
export const listReviewsQuerySchema = z.object({
  id_album: targetIdSchema.optional(),
  id_song: targetIdSchema.optional(),
  // Deja solo las reseñas de álbum, o solo las de canción, sin decir de cuál.
  //
  // Es lo que necesitan las pestañas "Álbumes" y "Canciones" del perfil, que
  // muestran lo que ese usuario calificó. No se pisa con los dos filtros de
  // arriba: aquellos apuntan a UN ítem puntual y este a todo un tipo.
  target: z
    .enum(REVIEW_TARGETS, {
      message: `El tipo de ítem debe ser uno de: ${REVIEW_TARGETS.join(', ')}.`,
    })
    .optional(),
  // Deja solo las reseñas de un usuario. Es lo que necesita el listado del perfil.
  id_user: z.coerce
    .number()
    .int()
    .positive('El id del usuario debe ser un número positivo.')
    .optional(),
  state: z
    .enum(REVIEW_STATES, {
      message: `El estado debe ser uno de: ${REVIEW_STATES.join(', ')}.`,
    })
    .optional(),
  // Filtro por estrellas: "de 4 para arriba". Usa la misma escala que el alta, así
  // que también tiene que ser múltiplo de 0,5.
  min_rating: ratingSchema.optional(),
  // Feed de amigos: deja solo las reseñas de la gente que sigue el usuario que
  // hace la request. Es lo que alimenta la solapa "Amigos" de /reviews.
  //
  // No incluye las reseñas propias: son las de la gente que seguís, y las tuyas
  // ya las ves en tu perfil.
  //
  // Va como filtro y no como un endpoint /feed aparte porque es exactamente la
  // misma consulta con un WHERE de más: mismo orden, mismo paginado, misma regla
  // de visibilidad y los mismos includes.
  //
  // No se usa z.coerce.boolean(): en un query string TODO llega como texto, y
  // coerce daría true incluso para "false". Se piden los dos literales y se
  // traduce a mano.
  following: z
    .enum(['true', 'false'], { message: 'El filtro de amigos se manda como true o false.' })
    .transform((value) => value === 'true')
    .optional(),
  // Tope de la tanda y desde qué fila arranca. Juntos arman el paginado: la
  // primera tanda va sin offset y la siguiente con el total ya mostrado. No hace
  // falta devolver un total, igual que en el explorador de álbumes: el botón "Ver
  // más" se muestra mientras la última tanda haya vuelto completa.
  limit: z.coerce
    .number()
    .int()
    .min(1, 'El tope tiene que ser mayor a cero.')
    .max(MAX_LIMIT, `El tope no puede ser mayor a ${MAX_LIMIT}.`)
    .default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0, 'El desde no puede ser negativo.').default(0),
})
  // Los dos filtran por autor sobre la misma columna, así que juntos serían un
  // pedido contradictorio. Se rechaza con un 400 explícito en vez de resolverlo
  // en silencio a favor de uno de los dos.
  .refine((data) => !(data.following && data.id_user !== undefined), {
    message: 'El feed de amigos no se combina con el filtro por usuario.',
  });

// GET /api/reviews/mine?id_album=5 — la reseña propia sobre un ítem puntual.
// Mismo XOR que el alta: se pregunta por un álbum o por una canción.
export const myReviewQuerySchema = z
  .object({
    id_album: targetIdSchema.optional(),
    id_song: targetIdSchema.optional(),
  })
  .refine(hasExactlyOneTarget, { message: TARGET_MESSAGE });

// Alta de un comentario (POST /api/reviews/:id/comments).
//
// A diferencia del texto de una reseña, acá es obligatorio: un comentario vacío no
// es nada, mientras que una reseña puede ser una calificación sola. El techo es
// más bajo por lo mismo: un comentario es una respuesta, no un ensayo.
export const createCommentSchema = z.object({
  text_comment: z
    .string()
    .trim()
    .min(1, 'El comentario no puede estar vacío.')
    .max(1000, 'El comentario no puede tener más de 1000 caracteres.'),
});

// El :idComment de una ruta anidada (DELETE /api/reviews/:id/comments/:idComment).
// Lleva los dos ids porque la ruta los recibe a los dos.
export const commentParamsSchema = z.object({
  id: z.coerce.number().int().positive('El id de la reseña debe ser un número positivo.'),
  idComment: z.coerce
    .number()
    .int()
    .positive('El id del comentario debe ser un número positivo.'),
});

// GET /api/reviews/stats?id_user=4 — las estadísticas de un usuario puntual.
export const reviewStatsQuerySchema = z.object({
  id_user: z.coerce
    .number({ error: 'Hay que indicar de qué usuario son las estadísticas.' })
    .int()
    .positive('El id del usuario debe ser un número positivo.'),
});

export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentParams = z.infer<typeof commentParamsSchema>;
export type ReviewStatsQuery = z.infer<typeof reviewStatsQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type MyReviewQuery = z.infer<typeof myReviewQuerySchema>;
