// Reglas de validación del formulario de listas. Copian las de list.schema.ts
// del backend, con sus mismos mensajes: la validación que vale es la de la API,
// esta solo avisa antes de gastar la request.
import { maxLength, required, validateField } from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';

/** Cuántos ítems acepta el alta de una vez: MAX_ITEMS_ON_CREATE en list.schema.ts. */
export const MAX_ITEMS_ON_CREATE = 50;

export type ListField = 'name' | 'description' | 'items';

/**
 * Valida la lista. Los ítems solo cuentan en el alta: en la edición se manejan
 * desde la ficha de la lista.
 *
 * @param values lo cargado en el formulario y cuántos ítems se eligieron.
 * @param isEditing true si se está editando una lista que ya existe.
 * @returns el mensaje de error de cada campo, o undefined si está bien.
 */
export function validateListForm(
  values: { name: string; description: string; itemCount: number },
  isEditing: boolean
): FieldErrors<ListField> {
  let items: string | undefined;
  if (!isEditing && values.itemCount === 0) {
    items = 'Una lista tiene que tener al menos un álbum o una canción.';
  } else if (!isEditing && values.itemCount > MAX_ITEMS_ON_CREATE) {
    items = `No se pueden agregar más de ${MAX_ITEMS_ON_CREATE} ítems de una vez.`;
  }

  return {
    name: validateField(values.name, [
      required('El nombre de la lista no puede estar vacío.'),
      maxLength(100, 'El nombre de la lista no puede tener más de 100 caracteres.'),
    ]),
    description: validateField(values.description, [
      maxLength(500, 'La descripción no puede tener más de 500 caracteres.'),
    ]),
    items,
  };
}
