// Formulario de alta y edición de un género (un único campo: el nombre).
// Es controlado y no guarda nada: delega el submit al padre, igual que ArtistForm.
//
// A diferencia de ArtistForm no consulta nombres parecidos antes de enviar: los
// géneros son once y los administra un ADMIN, así que no hace falta avisar de un
// posible duplicado. El nombre repetido lo sigue rechazando el backend con un 409.
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { GenreInput } from '../services/genreService';
import '../styles/_genre.scss';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const succeeded = await onSubmit({ name });
    // En una edición el campo queda como está porque sigue siendo el dato del
    // género; en un alta se vacía para poder cargar el siguiente.
    if (succeeded && !isEditing) setName('');
  };

  return (
    <form className="genre-form" onSubmit={handleSubmit}>
      <div className="genre-form__field">
        <label htmlFor="genre-name" className="genre-form__label">
          Nombre
        </label>
        <input
          id="genre-name"
          type="text"
          className="genre-form__input"
          placeholder="Rock Nacional, Jazz, Trip Hop..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          // El límite se valida igual en el backend; acá es para avisar antes de
          // gastar una request.
          maxLength={60}
          required
        />
      </div>

      <div className="genre-form__actions">
        <button type="submit" className="genre-form__submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            className="genre-form__cancel-btn"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
