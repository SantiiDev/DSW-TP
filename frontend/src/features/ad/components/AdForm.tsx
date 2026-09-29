// Formulario de alta y edición de un anuncio (título, descripción, imagen y
// enlace). Es controlado y no guarda nada: delega el submit al padre, igual que
// PlanForm.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import type { AdInput } from '../services/adService';
import '../styles/_ad-admin.scss';

/**
 * Valores del formulario, todos como texto porque así viven en los inputs.
 *
 * Se exporta porque la sección de administración los arma a partir del anuncio
 * que se está editando (ver toFormValues en AdAdminSection).
 */
export type AdFormValues = {
  title: string;
  description: string;
  urlImage: string;
  targetUrl: string;
};

type AdFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una
   * edición son los del anuncio que se está modificando.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una `key`
   * distinta cuando cambia de anuncio.
   */
  initialValues?: AdFormValues;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: AdInput) => Promise<boolean>;
  onCancel?: () => void;
};

const EMPTY_VALUES: AdFormValues = {
  title: '',
  description: '',
  urlImage: '',
  targetUrl: '',
};

export const AdForm = ({
  initialValues,
  isSubmitting,
  submitLabel = 'Guardar anuncio',
  onSubmit,
  onCancel,
}: AdFormProps) => {
  const isEditing = initialValues !== undefined;

  const [values, setValues] = useState<AdFormValues>(initialValues ?? EMPTY_VALUES);

  /** Actualiza un solo campo, dejando los demás como estaban. */
  const handleChange = (field: keyof AdFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const succeeded = await onSubmit({
      title: values.title.trim(),
      // El backend traduce el string vacío a null igual, pero mandarlo ya
      // convertido evita que un anuncio quede con la descripción en "".
      description: values.description.trim() === '' ? null : values.description.trim(),
      url_image: values.urlImage.trim(),
      target_url: values.targetUrl.trim() === '' ? null : values.targetUrl.trim(),
      // `active` no se manda a propósito: en un alta el backend lo pone en true, y
      // en una edición no mandarlo deja el anuncio como estaba. Si se enviara,
      // editarle el título a un anuncio pausado lo volvería a publicar sin que
      // nadie lo haya pedido. De pausar y reanudar se encarga el interruptor de
      // la tabla.
    });

    // En una edición los campos quedan como están porque siguen siendo los datos
    // del anuncio; en un alta se vacían para poder cargar el siguiente.
    if (succeeded && !isEditing) setValues(EMPTY_VALUES);
  };

  return (
    <form className="ad-form" onSubmit={handleSubmit}>
      <FormField id="ad-title" label="Título">
        <TextInput
          id="ad-title"
          type="text"
          placeholder="Vinilos Club"
          value={values.title}
          onChange={(e) => handleChange('title', e.target.value)}
          // El límite se valida igual en el backend; acá es para avisar antes de
          // gastar una request.
          maxLength={80}
          required
        />
      </FormField>

      <FormField id="ad-description" label="Descripción" hint="(opcional)">
        <TextInput
          as="textarea"
          id="ad-description"
          rows={2}
          placeholder="Una línea corta: es el texto que va debajo de la imagen."
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={200}
        />
      </FormField>

      <FormField
        id="ad-image"
        label="Imagen"
        hint="(ruta dentro de public/, en vertical 3:4)"
      >
        <TextInput
          id="ad-image"
          type="text"
          placeholder="/images/ads/ad-vinyl.jpg"
          value={values.urlImage}
          onChange={(e) => handleChange('urlImage', e.target.value)}
          maxLength={500}
          required
        />
      </FormField>

      {/* type="text" y no type="url": el navegador rechazaría "/pro", que es
          justamente lo que lleva el anuncio de la propia membresía. Quien valida
          las dos formas es el backend. */}
      <FormField
        id="ad-target"
        label="Enlace"
        hint="(opcional: https://… se abre en otra pestaña, /pro navega dentro del sitio)"
      >
        <TextInput
          id="ad-target"
          type="text"
          placeholder="https://example.com/vinilos-club"
          value={values.targetUrl}
          onChange={(e) => handleChange('targetUrl', e.target.value)}
          maxLength={500}
        />
      </FormField>

      <div className="ad-form__actions">
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
