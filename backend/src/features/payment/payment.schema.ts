// Schemas de Zod para validar la entrada de los endpoints de pago.
// Los usa el middleware validate() en payment.routes.ts, antes del controller.
import { z } from 'zod';

// Arranque del checkout (POST /api/payments/checkout). El usuario NO se recibe
// del cliente: sale del token. Lo único que se elige es qué plan se contrata.
export const createCheckoutSchema = z.object({
  id_plan: z.coerce
    .number()
    .int()
    .positive('El id del plan debe ser un número positivo.'),
});

// Confirmación desde la pantalla de retorno (POST /api/payments/confirm).
//
// El id llega como string y NO se convierte a número: para MercadoPago es un
// identificador, no una cantidad, y en la columna id_gateway se guarda como
// texto. Convertirlo arriesgaría perder precisión en ids largos.
export const confirmPaymentSchema = z.object({
  payment_id: z
    .string()
    .trim()
    .min(1, 'Falta el identificador del pago.')
    .max(100, 'El identificador del pago es demasiado largo.'),
});

// El webhook NO tiene schema a propósito, y es la única ruta del sistema sin
// validate(). MercadoPago manda varios formatos de aviso (unos con los datos en
// la query, otros en el body) y reintenta durante días todo lo que no le
// responda 200. Un schema estricto convertiría cualquier formato inesperado en
// un 400, y MercadoPago lo reintentaría para siempre. El controller lee lo que
// entiende y contesta 200 a todo lo demás.

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
