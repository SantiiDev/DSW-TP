// Modal de la pestaña "Aportes" del perfil: sirve para proponer una canción nueva
// y para corregir una propuesta propia que todavía no se aprobó.
//
// Adentro va el mismo SongForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usa la propuesta de álbum.
import { FormModal } from '../../../core/components/FormModal';
import { SongForm } from './SongForm';
import type { SongInput } from '../services/songService';
import type { Song } from '../models/Song';

type SongProposalModalProps = {
  isOpen: boolean;
  /**
   * Aporte que se está editando, o null si es una propuesta nueva. Es lo único
   * que separa los dos modos del modal.
   */
  song?: Song | null;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: SongInput) => Promise<boolean>;
  onClose: () => void;
};

/** Pasa una canción ya cargada a los valores que espera el formulario. */
function toFormValues(song: Song): SongInput {
  return {
    song_title: song.title,
    number_track: String(song.numberTrack),
    duration: song.duration === null ? '' : String(song.duration),
    id_album: song.album?.id ?? 0,
  };
}

export const SongProposalModal = ({
  isOpen,
  song = null,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: SongProposalModalProps) => {
  const isEditing = song !== null;

  return (
    <FormModal
      isOpen={isOpen}
      title={isEditing ? `Editar la propuesta de ${song.title}` : 'Proponer una canción'}
      hint={
        isEditing
          ? 'Corregí lo que haga falta. El aporte vuelve a quedar pendiente para que un administrador lo revise de nuevo.'
          : 'Cargá la pista que falte en el tracklist de un álbum. Buscá el álbum por su título o por el artista. Tu propuesta queda pendiente hasta que un administrador la revise.'
      }
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      {/* La key remonta el formulario al pasar de un aporte a otro (o de editar a
          proponer): los valores iniciales se leen una sola vez, al montar. */}
      <SongForm
        key={song?.id ?? 'new'}
        initialValues={song ? toFormValues(song) : undefined}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? 'Guardar cambios' : 'Enviar propuesta'}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
