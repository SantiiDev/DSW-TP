// Modal para proponer un artista nuevo desde la pestaña "Aportes" del perfil.
//
// Adentro va el mismo ArtistForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usan las propuestas de álbum y de canción.
import { FormModal } from '../../../core/components/FormModal';
import { ArtistForm } from './ArtistForm';
import type { ArtistInput } from '../services/artistService';

type ArtistProposalModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: ArtistInput) => Promise<boolean>;
  onClose: () => void;
};

export const ArtistProposalModal = ({
  isOpen,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: ArtistProposalModalProps) => {
  return (
    <FormModal
      isOpen={isOpen}
      title="Proponer un artista"
      hint="Cargá el artista que falte en Musicboxd. Tu propuesta queda pendiente hasta que un administrador la revise."
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      <ArtistForm
        isSubmitting={isSubmitting}
        submitLabel="Enviar propuesta"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
