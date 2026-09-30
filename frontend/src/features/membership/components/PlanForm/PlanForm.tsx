// Formulario de alta y edición de un plan de membresía (nombre, monto y
// descripción). Es controlado y no guarda nada: delega el submit al padre, igual
// que GenreForm.
//
// El monto se maneja como texto y no como número por la misma razón por la que
// existe NumberInput: un <input type="number"> cambia el valor solo si se lo
// scrollea sin querer, y acá eso sería cambiarle el precio a un plan. La
// conversión a número se hace una sola vez, al enviar.
//
// Valida con reglas propias (core/utils/validators) y no con las del navegador.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../../core/components/Button';
import { FormField, TextInput } from '../../../../core/components/FormField';
import {
  fieldErrorProps,
  hasErrors,
  isNumberBetween,
  maxLength,
  required,
  validateField,
} from '../../../../core/utils/validators';
import type { FieldErrors } from '../../../../core/utils/validators';
import type { PlanInput } from '../../services/membershipService';
import './PlanForm.scss';

/**
 * Valores del formulario. El monto va como texto porque el campo puede estar
 * vacío mientras se escribe, y '' no es un número.
 *
 * Se exporta porque la sección de administración arma estos valores a partir del
 * plan que se está editando (ver toFormValues en PlanAdminSection).
 */
export type PlanFormValues = {
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
 * Valida el plan con las mismas reglas y mensajes que plan.schema.ts del backend.
 * El monto tope es el que entra en la columna DECIMAL(10,2).
 */
function validatePlanForm(values: PlanFormValues): FieldErrors<keyof PlanFormValues> {
  return {
    name: validateField(values.name, [
      required('El nombre del plan no puede estar vacío.'),
      maxLength(50, 'El nombre del plan no puede tener más de 50 caracteres.'),
    ]),
    amount: validateField(values.amount, [
      required('Ingresá el monto (0 si el plan es gratis).'),
      isNumberBetween(0, 99999999.99, 'El monto tiene que estar entre 0 y 99.999.999,99.'),
    ]),
    description: validateField(values.description, [
      maxLength(500, 'La descripción no puede tener más de 500 caracteres.'),
    ]),
  };
}

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
  // Errores visibles recién después del primer intento de guardar; desde ahí se
  // recalculan en cada tecla.
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const errors: FieldErrors<keyof PlanFormValues> = wasSubmitted ? validatePlanForm(values) : {};

  /** Actualiza un solo campo, dejando los demás como estaban. */
  const handleChange = (field: keyof PlanFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validatePlanForm(values))) return;

    const succeeded = await onSubmit({
      name: values.name.trim(),
      // La validación ya garantizó que hay un número: Number('') daría 0, pero un
      // monto vacío no llega hasta acá.
      amount: Number(values.amount),
      // El backend traduce el string vacío a null igual, pero mandarlo ya
      // convertido evita que un plan quede con la descripción en "".
      description: values.description.trim() === '' ? null : values.description.trim(),
    });

    // En una edición los campos quedan como están porque siguen siendo los datos
    // del plan; en un alta se vacían para poder cargar el siguiente.
    if (succeeded && !isEditing) {
      setValues(EMPTY_VALUES);
      setWasSubmitted(false);
    }
  };

  return (
    <form className="plan-form" onSubmit={handleSubmit} noValidate>
      <div className="plan-form__row">
        <FormField id="plan-name" label="Nombre" error={errors.name}>
          <TextInput
            id="plan-name"
            type="text"
            placeholder="Pro, Free, Estudiante..."
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            {...fieldErrorProps('plan-name', errors.name)}
          />
        </FormField>

        <FormField
          id="plan-amount"
          label="Monto del pago único"
          hint="(en pesos, 0 si es gratis)"
          error={errors.amount}
        >
          <TextInput
            id="plan-amount"
            type="text"
            inputMode="decimal"
            placeholder="3500"
            value={values.amount}
            onChange={(e) => handleChange('amount', filterAmount(e.target.value))}
            {...fieldErrorProps('plan-amount', errors.amount)}
          />
        </FormField>
      </div>

      <FormField
        id="plan-description"
        label="Descripción"
        hint="(opcional)"
        error={errors.description}
      >
        <TextInput
          as="textarea"
          id="plan-description"
          rows={3}
          placeholder="Qué incluye el plan. Es el texto que se muestra en la página de venta."
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          {...fieldErrorProps('plan-description', errors.description)}
        />
      </FormField>

      <div className="plan-form__actions">
        {onCancel && (
          <Button variant="subtle" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
