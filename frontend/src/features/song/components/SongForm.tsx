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
import { Alert } from '../../../core/components/Alert';
import { Button } from '../../../core/components/Button';
import { FormField, NumberInput, TextInput } from '../../../core/components/FormField';
import { Loader } from '../../../core/components/Loader';
import { Select } from '../../../core/components/Select';
import type { SelectOption } from '../../../core/components/Select';
import { useFetch } from '../../../core/hooks/useFetch';
import { albumService } from '../../album/services/albumService';
import type { SongInput } from '../services/songService';
import '../styles/_song.scss';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const succeeded = await onSubmit(form);
    // En una edición los campos quedan como están porque siguen siendo los datos
    // de la canción; en un alta se vacían para poder cargar la siguiente.
    if (succeeded && !isEditing) setForm(EMPTY_FORM);
  };

  if (isLoading) return <Loader message="Cargando álbumes..." />;

  // Sin la lista no se puede elegir a qué álbum va la pista.
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <form className="song-form" onSubmit={handleSubmit}>
      <FormField id="song-title" label="Título">
        <TextInput
          id="song-title"
          type="text"
          placeholder="Smells Like Teen Spirit, Paranoid Android..."
          value={form.song_title}
          onChange={(e) => setForm({ ...form, song_title: e.target.value })}
          // Los límites se validan igual en el backend; acá son para avisar antes
          // de gastar una request.
          maxLength={200}
          required
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
      </div>

      <div className="song-form__row">
        <FormField
          id="song-track"
          label="Número de pista"
          hint="(opcional: si no ponés uno, va al final)"
        >
          <NumberInput
            id="song-track"
            placeholder="1"
            value={form.number_track ?? ''}
            onValueChange={(number_track) => setForm({ ...form, number_track })}
          />
        </FormField>

        <FormField id="song-duration" label="Duración" hint="(en segundos, opcional)">
          <NumberInput
            id="song-duration"
            placeholder="301"
            value={form.duration ?? ''}
            onValueChange={(duration) => setForm({ ...form, duration })}
          />
        </FormField>
      </div>

      <div className="song-form__actions">
        {/* Sin álbum elegido el backend responde 400, así que no se deja enviar. */}
        <Button type="submit" disabled={isSubmitting || form.id_album === NO_ALBUM}>
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
