// Schemas de Zod para validar la entrada de los endpoints de suscripciones.
// Los usa el middleware validate() en subscription.routes.ts, antes del controller.
import { z } from 'zod';
import { SUBSCRIPTION_STATES } from '../../shared/types/enums';

// Filtros del listado de administración (GET /api/subscriptions?state=active).
//
// No hay schema para "mi membresía" ni para la baja: las dos sacan el usuario del
// token, así que no reciben nada del cliente. Que el id_user no se pueda mandar
// por parámetro es justamente lo que impide que alguien dé de baja la membresía
// de otro.
export const listSubscriptionsQuerySchema = z.object({
  id_user: z.coerce
    .number()
    .int()
    .positive('El id del usuario debe ser un número positivo.')
    .optional(),
  state: z
    .enum(SUBSCRIPTION_STATES, {
      message: `El estado debe ser uno de: ${SUBSCRIPTION_STATES.join(', ')}.`,
    })
    .optional(),
});

export type ListSubscriptionsQuery = z.infer<typeof listSubscriptionsQuerySchema>;
