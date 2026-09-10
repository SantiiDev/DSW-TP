// Modal de la pestaña "Aportes" del perfil: sirve para proponer un artista nuevo
// y para corregir una propuesta propia que todavía no se aprobó.
//
// Adentro va el mismo ArtistForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usan las propuestas de álbum y de canción.
import { FormModal } from '../../../core/components/FormModal';
import { ArtistForm } from './ArtistForm';
import type { ArtistInput } from '../services/artistService';
import type { Artist } from '../models/Artist';

type ArtistProposalModalProps = {
  isOpen: boolean;
  /**
   * Aporte que se está editando, o null si es una propuesta nueva. Es lo único
   * que separa los dos modos del modal.
   */
  artist?: Artist | null;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: ArtistInput) => Promise<boolean>;
  onClose: () => void;
};

export const ArtistProposalModal = ({
  isOpen,
  artist = null,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: ArtistProposalModalProps) => {
  const isEditing = artist !== null;

  return (
    <FormModal
      isOpen={isOpen}
      title={isEditing ? `Editar la propuesta de ${artist.name}` : 'Proponer un artista'}
      hint={
        isEditing
          ? 'Corregí lo que haga falta. El aporte vuelve a quedar pendiente para que un administrador lo revise de nuevo.'
          : 'Cargá el artista que falte en Musicboxd. Tu propuesta queda pendiente hasta que un administrador la revise.'
      }
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      {/* La key remonta el formulario al pasar de un aporte a otro (o de editar a
          proponer): los valores iniciales se leen una sola vez, al montar. */}
      <ArtistForm
        key={artist?.id ?? 'new'}
        initialValues={
          artist ? { name: artist.name, biography: artist.biography ?? '' } : undefined
        }
        excludeArtistId={artist?.id}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? 'Guardar cambios' : 'Enviar propuesta'}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
