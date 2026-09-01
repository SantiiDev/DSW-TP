// Schemas de Zod para validar la entrada de los endpoints del CRUD de planes.
// Los usa el middleware validate() en plan.routes.ts, antes del controller.
import { z } from 'zod';

// Regla del nombre definida una sola vez: la comparten el alta y la edición.
// El máximo acompaña al STRING(50) de la columna: si no, el error lo terminaría
// tirando MySQL y con un mensaje que no le sirve al usuario.
const nameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del plan no puede estar vacío.')
  .max(50, 'El nombre del plan no puede tener más de 50 caracteres.');

// El precio del plan. Es plata, así que la columna es un DECIMAL(10,2) y acá se
// pide lo mismo: no negativo y con dos decimales como mucho.
//
// El tope de 99.999.999,99 es el que aguanta un DECIMAL(10,2). Sin este chequeo
// un monto más grande lo rechazaría MySQL con un error de rango, que sale como
// un 500 y no le dice nada a quien cargó el formulario.
const amountSchema = z.coerce
  .number({ error: 'El monto tiene que ser un número.' })
  .min(0, 'El monto no puede ser negativo.')
  .max(99999999.99, 'El monto es demasiado grande.')
  // La columna guarda dos decimales: un 3500.999 se redondearía solo al insertar,
  // y el plan terminaría costando algo distinto de lo que se cargó.
  //
  // Se compara contra el valor redondeado a centavos en vez de pedir que
  // `value * 100` sea entero, porque en punto flotante 35.15 * 100 da
  // 3514.9999999999995 y un monto perfectamente válido quedaría rechazado.
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.001, {
    message: 'El monto puede tener dos decimales como máximo.',
  });

// La descripción es el texto que se muestra en la página de venta. Es opcional:
// un plan puede existir sin descripción, aunque los dos del seed la tengan.
// El string vacío se traduce a null, que es lo que manda el formulario cuando se
// deja el campo en blanco (mismo criterio que url_cover en album.schema.ts).
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

// El :id de la URL llega siempre como string; se valida y convierte a número acá,
// así el resto de las capas ya lo reciben tipado como number.
export const planIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un número positivo.'),
});

// Alta de un plan (POST /api/plans).
export const createPlanSchema = z.object({
  name: nameSchema,
  amount: amountSchema,
  description: descriptionSchema.optional(),
});

// Edición de un plan (PATCH /api/plans/:id). Los tres campos son opcionales
// porque un PATCH puede tocar uno solo, pero tiene que venir al menos uno: si no,
// la request no pide ningún cambio y devolver 200 sería mentir.
export const updatePlanSchema = z
  .object({
    name: nameSchema.optional(),
    amount: amountSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Hay que enviar al menos un campo para modificar.',
  });

export type PlanIdParam = z.infer<typeof planIdParamSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
