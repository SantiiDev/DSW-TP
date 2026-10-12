// Formulario de alta y edición de una lista personalizada.
// Es controlado y no guarda nada: delega el submit al padre, igual que GenreForm.
//
// Tiene dos modos, y la diferencia es de negocio, no de estilo:
//
//   - ALTA: arranca eligiendo de qué va a ser la lista (álbumes o canciones),
//     trae el buscador del tipo elegido, y no deja enviar hasta que haya al
//     menos un ítem (lo avisa con un mensaje). Una lista vacía sería un nombre
//     suelto y no una agrupación; el backend la rechaza igual (ver
//     createListSchema), acá se avisa antes de gastar la request.
//   - EDICIÓN: solo nombre y descripción. Los ítems de una lista ya creada se
//     suman y se sacan de a uno desde su ficha, y el tipo no se puede cambiar
//     nunca (sus ítems viven en la tabla intermedia de su tipo).
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Info } from 'lucide-react';
import { Button } from '../../../../core/components/Button';
import { FormField, TextInput } from '../../../../core/components/FormField';
import { InlineNotice } from '../../../../core/components/InlineNotice';
import { SegmentedControl } from '../../../../core/components/SegmentedControl';
import { fieldErrorProps, hasErrors } from '../../../../core/utils/validators';
import type { FieldErrors } from '../../../../core/utils/validators';
import type { SegmentOption } from '../../../../core/components/SegmentedControl';
import type { ListType } from '../../models/List';
import type { ListInput } from '../../services/listService';
import { validateListForm } from '../../models/listRules';
import type { ListField } from '../../models/listRules';
import { ListItemPicker } from '../ListItemPicker';
import type { PickedItem } from '../ListItemPicker';
import { PickedItemsList } from '../PickedItemsList';
import './ListForm.scss';

/**
 * Las dos secciones del alta. Es el mismo SegmentedControl que usa el modal de
 * administrar ítems: la opción elegida se pinta con el verde del sitio.
 */
const TYPES = [
  { value: 'album', label: 'Álbumes' },
  { value: 'song', label: 'Canciones' },
] as const satisfies readonly SegmentOption<ListType>[];

/** Los textos que cambian según la sección elegida. */
const COPY: Record<ListType, { label: string; hint: string; counter: (n: number) => string }> = {
  album: {
    label: 'Álbumes',
    hint: 'Elegí al menos uno para poder crear la lista',
    counter: (n) => `${n} elegido${n === 1 ? '' : 's'}`,
  },
  song: {
    label: 'Canciones',
    hint: 'Elegí al menos una para poder crear la lista',
    counter: (n) => `${n} elegida${n === 1 ? '' : 's'}`,
  },
};

type ListFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una
   * edición son los de la lista que se está modificando. Su presencia es además
   * lo que decide el modo: con valores iniciales no se muestra ni el selector de
   * tipo ni el buscador.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una
   * `key` distinta al pasar de una lista a otra, así no hace falta sincronizar
   * el estado con las props.
   */
  initialValues?: Pick<ListInput, 'name' | 'description'>;
  /**
   * Tipo con el que arranca el alta, y ítem ya elegido. Los usa el botón
   * "Agregar a una lista" de la ficha de un álbum o de una canción, que abre el
   * formulario con ese ítem adentro y el tipo que le corresponde.
   */
  initialType?: ListType;
  initialItems?: PickedItem[];
  /**
   * Si se puede cambiar de sección. Es false cuando el formulario se abrió desde
   * la ficha de un ítem: ahí el tipo ya lo decidió de dónde se vino.
   */
  canChooseType?: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: ListInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

export const ListForm = ({
  initialValues,
  initialType = 'album',
  initialItems = [],
  canChooseType = true,
  isSubmitting,
  submitLabel = 'Crear lista',
  onSubmit,
  onCancel,
}: ListFormProps) => {
  const isEditing = initialValues !== undefined;

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [type, setType] = useState<ListType>(initialType);
  const [items, setItems] = useState<PickedItem[]>(initialItems);
  // Se muestra al cambiar de sección habiendo elegido algo, para explicar por
  // qué desapareció la selección.
  const [wasCleared, setWasCleared] = useState(false);

  // Errores visibles recién después del primer intento de guardar; desde ahí se
  // recalculan en cada cambio (criterio común a todos los formularios). Antes el
  // botón quedaba deshabilitado sin nombre o sin ítems, sin decir por qué.
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const currentValues = { name, description, itemCount: items.length };
  const errors: FieldErrors<ListField> = wasSubmitted
    ? validateListForm(currentValues, isEditing)
    : {};

  /**
   * Cambia de sección y VACÍA lo elegido. Es la consecuencia directa de que una
   * lista no pueda tener álbumes y canciones a la vez: lo que se había elegido
   * es del otro tipo y no puede viajar al alta.
   */
  const handleTypeChange = (next: ListType) => {
    if (next === type) return;

    setWasCleared(items.length > 0);
    setItems([]);
    setType(next);
  };

  const handleAdd = (item: PickedItem) => {
    setWasCleared(false);
    setItems((current) => [...current, item]);
  };

  const handleRemove = (itemId: number) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateListForm(currentValues, isEditing))) return;

    const succeeded = await onSubmit({
      name,
      description,
      // La edición no manda ni tipo ni ítems: el backend no los acepta en el PATCH.
      ...(isEditing ? {} : { type, itemIds: items.map((item) => item.id) }),
    });

    // En una edición los campos quedan como están porque siguen siendo los datos
    // de la lista; en un alta se vacían para poder cargar la siguiente.
    if (succeeded && !isEditing) {
      setName('');
      setDescription('');
      setItems([]);
      setWasCleared(false);
      setWasSubmitted(false);
    }
  };

  return (
    <form className="list-form" onSubmit={handleSubmit} noValidate>
      {!isEditing && canChooseType && (
        <div className="list-form__type">
          <SegmentedControl
            options={TYPES}
            value={type}
            onChange={handleTypeChange}
            ariaLabel="De qué va a ser la lista"
          />
          <p className="list-form__type-hint">
            Una lista es de álbumes o de canciones: no puede tener las dos cosas.
          </p>

          {wasCleared && (
            <InlineNotice icon={<Info size={14} />}>
              Se vació lo que habías elegido: era del otro tipo.
            </InlineNotice>
          )}
        </div>
      )}

      <FormField id="list-name" label="Nombre" error={errors.name}>
        <TextInput
          id="list-name"
          type="text"
          placeholder="Favoritos del Rock Nacional"
          value={name}
          onChange={(e) => setName(e.target.value)}
          {...fieldErrorProps('list-name', errors.name)}
        />
      </FormField>

      <FormField
        id="list-description"
        label="Descripción"
        hint="(opcional)"
        error={errors.description}
      >
        <TextInput
          as="textarea"
          id="list-description"
          placeholder="De qué se trata esta lista..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          {...fieldErrorProps('list-description', errors.description)}
        />
      </FormField>

      {!isEditing && (
        <div className="list-form__items">
          <p className="list-form__items-label">
            {COPY[type].label}
            <span className="list-form__items-hint">
              {items.length === 0 ? COPY[type].hint : COPY[type].counter(items.length)}
            </span>
          </p>

          {items.length > 0 && (
            <PickedItemsList items={items} isBusy={isSubmitting} onRemove={handleRemove} />
          )}

          <ListItemPicker
            type={type}
            excludeIds={items.map((item) => item.id)}
            isBusy={isSubmitting}
            onAdd={handleAdd}
          />

          {/* Mismo aspecto que el error de FormField. */}
          {errors.items && <p className="form-field__error">{errors.items}</p>}
        </div>
      )}

      <div className="list-form__actions">
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
