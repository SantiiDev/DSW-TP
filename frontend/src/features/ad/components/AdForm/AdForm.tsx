// Formulario de alta y edición de un anuncio (título, descripción, imagen y
// enlace). Es controlado y no guarda nada: delega el submit al padre, igual que
// PlanForm.
//
// Valida con reglas propias (core/utils/validators), no con las del navegador.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../../core/components/Button';
import { FormField, TextInput } from '../../../../core/components/FormField';
import {
  fieldErrorProps,
  hasErrors,
  isUrl,
  maxLength,
  required,
  validateField,
} from '../../../../core/utils/validators';
import type { FieldErrors, Rule } from '../../../../core/utils/validators';
import type { AdInput } from '../../services/adService';
import './AdForm.scss';

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

const TARGET_MESSAGE = 'El enlace tiene que ser una URL (https://...) o una ruta del sitio (/pro).';

/**
 * El enlace admite dos formas: una URL completa, que se abre en otra pestaña, o
 * una ruta del propio sitio ("/pro"), que es lo que lleva el anuncio de la
 * membresía. Es el mismo refine de targetUrlSchema en ad.schema.ts.
 */
const isUrlOrSitePath: Rule = (value) =>
  value.trim().startsWith('/') ? null : isUrl(TARGET_MESSAGE)(value);

/** Valida el anuncio con las mismas reglas y mensajes que ad.schema.ts del backend. */
function validateAdForm(values: AdFormValues): FieldErrors<keyof AdFormValues> {
  return {
    title: validateField(values.title, [
      required('El título del anuncio no puede estar vacío.'),
      maxLength(80, 'El título del anuncio no puede tener más de 80 caracteres.'),
    ]),
    description: validateField(values.description, [
      maxLength(200, 'La descripción no puede tener más de 200 caracteres.'),
    ]),
    // La imagen es una ruta dentro de public/ y no una URL completa, así que no
    // se le exige formato (el backend tampoco): solo que esté y su largo.
    urlImage: validateField(values.urlImage, [
      required('El anuncio necesita una imagen.'),
      maxLength(500, 'La ruta de la imagen no puede tener más de 500 caracteres.'),
    ]),
    targetUrl: validateField(values.targetUrl, [
      maxLength(500, 'El enlace del anuncio no puede tener más de 500 caracteres.'),
      isUrlOrSitePath,
    ]),
  };
}

export const AdForm = ({
  initialValues,
  isSubmitting,
  submitLabel = 'Guardar anuncio',
  onSubmit,
  onCancel,
}: AdFormProps) => {
  const isEditing = initialValues !== undefined;

  const [values, setValues] = useState<AdFormValues>(initialValues ?? EMPTY_VALUES);
  // Errores visibles recién después del primer intento de guardar; desde ahí se
  // recalculan en cada tecla (criterio común a todos los formularios).
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const errors: FieldErrors<keyof AdFormValues> = wasSubmitted ? validateAdForm(values) : {};

  /** Actualiza un solo campo, dejando los demás como estaban. */
  const handleChange = (field: keyof AdFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateAdForm(values))) return;

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
    if (succeeded && !isEditing) {
      setValues(EMPTY_VALUES);
      setWasSubmitted(false);
    }
  };

  return (
    <form className="ad-form" onSubmit={handleSubmit} noValidate>
      <FormField id="ad-title" label="Título" error={errors.title}>
        <TextInput
          id="ad-title"
          type="text"
          placeholder="Vinilos Club"
          value={values.title}
          onChange={(e) => handleChange('title', e.target.value)}
          {...fieldErrorProps('ad-title', errors.title)}
        />
      </FormField>

      <FormField
        id="ad-description"
        label="Descripción"
        hint="(opcional)"
        error={errors.description}
      >
        <TextInput
          as="textarea"
          id="ad-description"
          rows={2}
          placeholder="Una línea corta: es el texto que va debajo de la imagen."
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          {...fieldErrorProps('ad-description', errors.description)}
        />
      </FormField>

      <FormField
        id="ad-image"
        label="Imagen"
        hint="(ruta dentro de public/, en vertical 3:4)"
        error={errors.urlImage}
      >
        <TextInput
          id="ad-image"
          type="text"
          placeholder="/images/ads/ad-vinyl.jpg"
          value={values.urlImage}
          onChange={(e) => handleChange('urlImage', e.target.value)}
          {...fieldErrorProps('ad-image', errors.urlImage)}
        />
      </FormField>

      {/* type="text" y no type="url": el navegador rechazaría "/pro", que es
          justamente lo que lleva el anuncio de la propia membresía. Las dos
          formas las acepta isUrlOrSitePath, igual que el backend. */}
      <FormField
        id="ad-target"
        label="Enlace"
        hint="(opcional: https://… se abre en otra pestaña, /pro navega dentro del sitio)"
        error={errors.targetUrl}
      >
        <TextInput
          id="ad-target"
          type="text"
          placeholder="https://example.com/vinilos-club"
          value={values.targetUrl}
          onChange={(e) => handleChange('targetUrl', e.target.value)}
          {...fieldErrorProps('ad-target', errors.targetUrl)}
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
