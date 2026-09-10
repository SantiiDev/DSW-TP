// Formulario de alta y edición de un plan de membresía (nombre, monto y
// descripción). Es controlado y no guarda nada: delega el submit al padre, igual
// que GenreForm.
//
// El monto se maneja como texto y no como número por la misma razón por la que
// existe NumberInput: un <input type="number"> cambia el valor solo si se lo
// scrollea sin querer, y acá eso sería cambiarle el precio a un plan. La
// conversión a número se hace una sola vez, al enviar.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import type { PlanInput } from '../services/membershipService';
import '../styles/_membership.scss';

/**
 * Valores del formulario. El monto va como texto porque el campo puede estar
 * vacío mientras se escribe, y '' no es un número.
 */
type PlanFormValues = {
  name: string;
  amount: string;
  description: string;
};

type PlanFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una
   * edición son los del plan que se está modificando.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una `key`
   * distinta cuando cambia de plan (ver PlanAdminSection).
   */
  initialValues?: PlanFormValues;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: PlanInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

const EMPTY_VALUES: PlanFormValues = { name: '', amount: '', description: '' };

/**
 * Deja pasar solo lo que puede formar un precio: dígitos y un único punto
 * decimal, con dos decimales como máximo. Es el mismo límite que valida el
 * backend, que guarda el monto en un DECIMAL(10,2).
 *
 * @param raw lo que hay escrito en el campo después de la última tecla.
 * @returns el texto ya filtrado, listo para volver al campo.
 */
function filterAmount(raw: string): string {
  // La coma es lo que se escribe naturalmente en español para separar decimales,
  // así que se acepta y se traduce, en vez de descartar la tecla en silencio.
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');

  const [whole, ...rest] = normalized.split('.');
  if (rest.length === 0) return whole;

  // Todo lo que venga después del primer punto es la parte decimal: si el usuario
  // escribió dos puntos, el segundo se descarta en lugar de partir el número.
  return `${whole}.${rest.join('').slice(0, 2)}`;
}

export const PlanForm = ({
  initialValues,
  isSubmitting,
  submitLabel = 'Guardar plan',
  onSubmit,
  onCancel,
}: PlanFormProps) => {
  const isEditing = initialValues !== undefined;

  const [values, setValues] = useState<PlanFormValues>(initialValues ?? EMPTY_VALUES);

  /** Actualiza un solo campo, dejando los demás como estaban. */
  const handleChange = (field: keyof PlanFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const succeeded = await onSubmit({
      name: values.name,
      // El campo es obligatorio, así que acá siempre hay un número; el Number('')
      // daría 0 y el required del input no deja llegar a ese caso.
      amount: Number(values.amount),
      // El backend traduce el string vacío a null igual, pero mandarlo ya
      // convertido evita que un plan quede con la descripción en "".
      description: values.description.trim() === '' ? null : values.description.trim(),
    });

    // En una edición los campos quedan como están porque siguen siendo los datos
    // del plan; en un alta se vacían para poder cargar el siguiente.
    if (succeeded && !isEditing) setValues(EMPTY_VALUES);
  };

  return (
    <form className="plan-form" onSubmit={handleSubmit}>
      <div className="plan-form__row">
        <FormField id="plan-name" label="Nombre">
          <TextInput
            id="plan-name"
            type="text"
            placeholder="Pro, Free, Estudiante..."
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            // El límite se valida igual en el backend; acá es para avisar antes
            // de gastar una request.
            maxLength={50}
            required
          />
        </FormField>

        <FormField id="plan-amount" label="Monto mensual" hint="(en pesos, 0 si es gratis)">
          <TextInput
            id="plan-amount"
            type="text"
            inputMode="decimal"
            placeholder="3500"
            value={values.amount}
            onChange={(e) => handleChange('amount', filterAmount(e.target.value))}
            required
          />
        </FormField>
      </div>

      <FormField id="plan-description" label="Descripción" hint="(opcional)">
        <TextInput
          as="textarea"
          id="plan-description"
          rows={3}
          placeholder="Qué incluye el plan. Es el texto que se muestra en la página de venta."
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={500}
        />
      </FormField>

      <div className="plan-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>

        {onCancel && (
          <Button variant="subtle" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
