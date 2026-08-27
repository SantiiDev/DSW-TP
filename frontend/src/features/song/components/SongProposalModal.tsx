// Modal para proponer una canción nueva desde la pestaña "Aportes" del perfil.
//
// Adentro va el mismo SongForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usa la propuesta de álbum.
import { FormModal } from '../../../core/components/FormModal';
import { SongForm } from './SongForm';
import type { SongInput } from '../services/songService';

type SongProposalModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: SongInput) => Promise<boolean>;
  onClose: () => void;
};

export const SongProposalModal = ({
  isOpen,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: SongProposalModalProps) => {
  return (
    <FormModal
      isOpen={isOpen}
      title="Proponer una canción"
      hint="Cargá la pista que falte en el tracklist de un álbum. Buscá el álbum por su título o por el artista. Tu propuesta queda pendiente hasta que un administrador la revise."
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      <SongForm
        isSubmitting={isSubmitting}
        submitLabel="Enviar propuesta"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
