// Formulario de alta y edición de una lista personalizada.
// Es controlado y no guarda nada: delega el submit al padre, igual que GenreForm.
//
// Tiene dos modos, y la diferencia es de negocio, no de estilo:
//
//   - ALTA: además del nombre y la descripción trae el buscador de álbumes, y no
//     deja enviar hasta que haya al menos uno elegido. Una lista vacía sería un
//     nombre suelto y no una agrupación de álbumes; el backend la rechaza igual
//     (ver createListSchema), acá se avisa antes de gastar la request.
//   - EDICIÓN: solo nombre y descripción. Los álbumes de una lista ya creada se
//     suman y se sacan de a uno desde su ficha, no desde este formulario.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { IconButton } from '../../../core/components/IconButton';
import { AlbumCover } from '../../genre/components/AlbumCover';
import type { Album } from '../../album/models/Album';
import type { ListInput } from '../services/listService';
import { ListAlbumPicker } from './ListAlbumPicker';
import '../styles/_list.scss';

/**
 * Un álbum ya elegido, reducido a lo que dibuja la fila del formulario. No se
 * guarda el modelo Album entero porque acá solo hace falta identificarlo y
 * mostrarlo.
 */
type SelectedAlbum = {
  id: number;
  title: string;
  urlCover: string | null;
  artistName: string;
};

type ListFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una
   * edición son los de la lista que se está modificando. Su presencia es además
   * lo que decide el modo: con valores iniciales no se muestra el buscador.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una
   * `key` distinta al pasar de una lista a otra, así no hace falta sincronizar
   * el estado con las props.
   */
  initialValues?: Pick<ListInput, 'name' | 'description'>;
  /**
   * Álbumes con los que arranca la selección del alta. Lo usa el botón
   * "Agregar a una lista" de la ficha de un álbum, que abre el formulario con
   * ese disco ya elegido.
   */
  initialAlbums?: SelectedAlbum[];
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: ListInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

/** Pasa un álbum del catálogo a la forma reducida que guarda el formulario. */
function toSelected(album: Album): SelectedAlbum {
  return {
    id: album.id,
    title: album.title,
    urlCover: album.urlCover,
    artistName: album.artistName,
  };
}

export const ListForm = ({
  initialValues,
  initialAlbums = [],
  isSubmitting,
  submitLabel = 'Crear lista',
  onSubmit,
  onCancel,
}: ListFormProps) => {
  const isEditing = initialValues !== undefined;

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [albums, setAlbums] = useState<SelectedAlbum[]>(initialAlbums);

  // En el alta hacen falta las dos cosas; en la edición, solo el nombre.
  const canSubmit = name.trim() !== '' && (isEditing || albums.length > 0) && !isSubmitting;

  const handleAdd = (album: Album) => {
    setAlbums((current) => [...current, toSelected(album)]);
  };

  const handleRemove = (albumId: number) => {
    setAlbums((current) => current.filter((album) => album.id !== albumId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const succeeded = await onSubmit({
      name,
      description,
      // La edición no manda álbumes: el backend no los acepta en el PATCH.
      ...(isEditing ? {} : { albumIds: albums.map((album) => album.id) }),
    });

    // En una edición los campos quedan como están porque siguen siendo los datos
    // de la lista; en un alta se vacían para poder cargar la siguiente.
    if (succeeded && !isEditing) {
      setName('');
      setDescription('');
      setAlbums([]);
    }
  };

  return (
    <form className="list-form" onSubmit={handleSubmit}>
      <FormField id="list-name" label="Nombre">
        <TextInput
          id="list-name"
          type="text"
          placeholder="Favoritos del Rock Nacional"
          value={name}
          onChange={(e) => setName(e.target.value)}
          // El límite se valida igual en el backend; acá es para avisar antes de
          // gastar una request.
          maxLength={100}
          required
        />
      </FormField>

      <FormField id="list-description" label="Descripción" hint="(opcional)">
        <TextInput
          as="textarea"
          id="list-description"
          placeholder="De qué se trata esta lista..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </FormField>

      {!isEditing && (
        <div className="list-form__albums">
          <p className="list-form__albums-label">
            Álbumes
            <span className="list-form__albums-hint">
              {albums.length === 0
                ? 'Elegí al menos uno para poder crear la lista'
                : `${albums.length} elegido${albums.length === 1 ? '' : 's'}`}
            </span>
          </p>

          {albums.length > 0 && (
            <ul className="list-form__selected">
              {albums.map((album) => (
                <li key={album.id} className="list-form__selected-item">
                  <AlbumCover title={album.title} url={album.urlCover} size="sm" />
                  <div className="list-form__selected-info">
                    <p className="list-form__selected-title">{album.title}</p>
                    <p className="list-form__selected-artist">{album.artistName}</p>
                  </div>
                  <IconButton
                    icon={<X size={16} />}
                    label={`Sacar ${album.title}`}
                    tone="danger"
                    disabled={isSubmitting}
                    onClick={() => handleRemove(album.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          <ListAlbumPicker
            excludeIds={albums.map((album) => album.id)}
            isBusy={isSubmitting}
            onAdd={handleAdd}
          />
        </div>
      )}

      <div className="list-form__actions">
        <Button type="submit" disabled={!canSubmit}>
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
