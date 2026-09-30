// Formulario de alta y edición de un género (un único campo: el nombre).
// Es controlado y no guarda nada: delega el submit al padre, igual que ArtistForm.
//
// A diferencia de ArtistForm no consulta nombres parecidos antes de enviar: los
// géneros son once y los administra un ADMIN, así que no hace falta avisar de un
// posible duplicado. El nombre repetido lo sigue rechazando el backend con un 409.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { fieldErrorProps, maxLength, required, validateField } from '../../../core/utils/validators';
import type { GenreInput } from '../services/genreService';
import '../styles/_genre.scss';

// Mismas reglas y mensajes que genre.schema.ts del backend.
const NAME_RULES = [
  required('El nombre del género no puede estar vacío.'),
  maxLength(60, 'El nombre del género no puede tener más de 60 caracteres.'),
];

type GenreFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una edición
   * son los del género que se está modificando.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una `key`
   * distinta cuando cambia de género (ver GenreAdminSection), así no hace falta
   * sincronizar el estado con las props.
   */
  initialValues?: GenreInput;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia el campo. */
  onSubmit: (input: GenreInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

export const GenreForm = ({
  initialValues,
  isSubmitting,
  submitLabel = 'Guardar género',
  onSubmit,
  onCancel,
}: GenreFormProps) => {
  const isEditing = initialValues !== undefined;

  const [name, setName] = useState(initialValues?.name ?? '');
  // El error se muestra recién después del primer intento de guardar, y desde ahí
  // se recalcula en cada tecla (criterio común a todos los formularios).
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const nameError = wasSubmitted ? validateField(name, NAME_RULES) : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (validateField(name, NAME_RULES)) return;

    const succeeded = await onSubmit({ name: name.trim() });
    // En una edición el campo queda como está porque sigue siendo el dato del
    // género; en un alta se vacía para poder cargar el siguiente.
    if (succeeded && !isEditing) {
      setName('');
      setWasSubmitted(false);
    }
  };

  return (
    <form className="genre-form" onSubmit={handleSubmit} noValidate>
      <FormField id="genre-name" label="Nombre" error={nameError}>
        <TextInput
          id="genre-name"
          type="text"
          placeholder="Rock Nacional, Jazz, Trip Hop..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...fieldErrorProps('genre-name', nameError)}
        />
      </FormField>

      <div className="genre-form__actions">
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
