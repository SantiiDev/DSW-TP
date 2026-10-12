// Formulario de alta y edición de una canción (título, álbum, número de pista y
// duración). Es controlado y no guarda nada: delega el submit al padre, igual que
// AlbumForm y ArtistForm.
//
// Trae por su cuenta la lista de álbumes para el desplegable, porque el mismo
// formulario se usa para proponer desde el perfil y para cargar desde el panel de
// administración. El servicio de album se usa solo para LEER: esta feature no
// crea álbumes, cuelga pistas de los que ya existen.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert } from '../../../../core/components/Alert';
import { Button } from '../../../../core/components/Button';
import { FormField, NumberInput, TextInput } from '../../../../core/components/FormField';
import { Loader } from '../../../../core/components/Loader';
import { Select } from '../../../../core/components/Select';
import type { SelectOption } from '../../../../core/components/Select';
import { useFetch } from '../../../../core/hooks/useFetch';
import {
  fieldErrorProps,
  hasErrors,
  isIntegerBetween,
  maxLength,
  required,
  validateField,
} from '../../../../core/utils/validators';
import type { FieldErrors } from '../../../../core/utils/validators';
import { albumService } from '../../../album/services/albumService';
import type { SongInput } from '../../services/songService';
import './SongForm.scss';

type SongFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una edición
   * son los de la canción que se está modificando.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una `key`
   * distinta cuando cambia de canción (ver SongAdminSection), así no hace falta
   * sincronizar el estado con las props.
   */
  initialValues?: SongInput;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: SongInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

// Una canción sin álbum todavía elegido. 0 nunca es un id real, y el Select
// necesita un valor concreto para mostrar su placeholder.
//
// El álbum es OBLIGATORIO: una canción suelta quedaría sin artista (ARTIST cuelga
// de ALBUMS, no de SONG) y no habría pantalla desde la que llegar a ella. La API
// tampoco las acepta; ver el comentario de idAlbumSchema en song.schema.ts.
const NO_ALBUM = 0;

const EMPTY_FORM: SongInput = {
  song_title: '',
  number_track: '',
  duration: '',
  id_album: NO_ALBUM,
};

type SongField = 'song_title' | 'id_album' | 'number_track' | 'duration';

/**
 * Valida la canción con las mismas reglas que song.schema.ts del backend. Los
 * topes son los de las columnas: la pista es un SMALLINT sin signo (65535) y la
 * duración, hasta diez horas en segundos.
 */
function validateSongForm(form: SongInput): FieldErrors<SongField> {
  return {
    song_title: validateField(form.song_title, [
      required('El título de la canción no puede estar vacío.'),
      maxLength(200, 'El título de la canción no puede tener más de 200 caracteres.'),
    ]),
    id_album:
      form.id_album === NO_ALBUM
        ? 'Hay que elegir el álbum al que pertenece la canción.'
        : undefined,
    number_track: validateField(form.number_track ?? '', [
      isIntegerBetween(1, 65535, 'El número de pista tiene que ser un entero mayor a cero.'),
    ]),
    duration: validateField(form.duration ?? '', [
      isIntegerBetween(1, 36000, 'La duración tiene que ser un entero de segundos mayor a cero.'),
    ]),
  };
}

export const SongForm = ({
  initialValues,
  isSubmitting,
  submitLabel = 'Guardar canción',
  onSubmit,
  onCancel,
}: SongFormProps) => {
  const isEditing = initialValues !== undefined;

  const [form, setForm] = useState<SongInput>({
    song_title: initialValues?.song_title ?? '',
    number_track: initialValues?.number_track ?? '',
    duration: initialValues?.duration ?? '',
    id_album: initialValues?.id_album ?? NO_ALBUM,
  });

  const { data, isLoading, error } = useFetch(() => albumService.list());

  // Los rechazados no se ofrecen: dejaron de formar parte del catálogo. A un PRO
  // la API le devuelve solo los aprobados, así que este filtro solo cambia algo
  // para un ADMIN, que los ve todos.
  //
  // La etiqueta lleva el artista porque hay títulos repetidos entre artistas
  // distintos ("Greatest Hits"), y sin él no se sabría cuál es cuál. Además es lo
  // que permite encontrar un álbum buscando por el nombre de la banda.
  const albumOptions: SelectOption<number>[] = (data ?? [])
    .filter((album) => album.state !== 'rejected')
    .map((album) => ({ value: album.id, label: `${album.title} — ${album.artistName}` }));

  // Errores visibles recién después del primer intento de guardar; desde ahí se
  // recalculan en cada cambio (criterio común a todos los formularios).
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const errors: FieldErrors<SongField> = wasSubmitted ? validateSongForm(form) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateSongForm(form))) return;

    const succeeded = await onSubmit(form);
    // En una edición los campos quedan como están porque siguen siendo los datos
    // de la canción; en un alta se vacían para poder cargar la siguiente.
    if (succeeded && !isEditing) {
      setForm(EMPTY_FORM);
      setWasSubmitted(false);
    }
  };

  if (isLoading) return <Loader message="Cargando álbumes..." />;

  // Sin la lista no se puede elegir a qué álbum va la pista.
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <form className="song-form" onSubmit={handleSubmit} noValidate>
      <FormField id="song-title" label="Título" error={errors.song_title}>
        <TextInput
          id="song-title"
          type="text"
          placeholder="Smells Like Teen Spirit, Paranoid Android..."
          value={form.song_title}
          onChange={(e) => setForm({ ...form, song_title: e.target.value })}
          {...fieldErrorProps('song-title', errors.song_title)}
        />
      </FormField>

      {/* Es un <span> y no un <label>: el desplegable propio es un botón, y un
          label envolviéndolo no lo describiría como sí lo hace su aria-label. */}
      <div className="form-field">
        <span className="form-field__label">Álbum</span>
        {/* searchable: son cientos de álbumes, y bajar hasta el que se busca a
            mano es impracticable. El buscador filtra por título y por artista. */}
        <Select
          options={albumOptions}
          value={form.id_album ?? NO_ALBUM}
          onChange={(id_album) => setForm({ ...form, id_album })}
          placeholder="Elegí un álbum"
          ariaLabel="Álbum al que pertenece la canción"
          searchable
          searchPlaceholder="Buscar por título o artista..."
          fullWidth
        />
        {/* Mismo aspecto que el error de FormField. Antes, sin álbum, el botón de
            guardar quedaba deshabilitado sin decir por qué. */}
        {errors.id_album && <p className="form-field__error">{errors.id_album}</p>}
      </div>

      <div className="song-form__row">
        <FormField
          id="song-track"
          label="Número de pista"
          hint="(opcional: si no ponés uno, va al final)"
          error={errors.number_track}
        >
          <NumberInput
            id="song-track"
            placeholder="1"
            value={form.number_track ?? ''}
            onValueChange={(number_track) => setForm({ ...form, number_track })}
            {...fieldErrorProps('song-track', errors.number_track)}
          />
        </FormField>

        <FormField
          id="song-duration"
          label="Duración"
          hint="(en segundos, opcional)"
          error={errors.duration}
        >
          <NumberInput
            id="song-duration"
            placeholder="301"
            value={form.duration ?? ''}
            onValueChange={(duration) => setForm({ ...form, duration })}
            {...fieldErrorProps('song-duration', errors.duration)}
          />
        </FormField>
      </div>

      <div className="song-form__actions">
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
