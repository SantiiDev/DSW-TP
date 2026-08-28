// Modal para proponer un álbum nuevo desde la pestaña "Aportes" del perfil.
//
// Adentro va el mismo AlbumForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usa la propuesta de canción.
import { FormModal } from '../../../core/components/FormModal';
import { AlbumForm } from './AlbumForm';
import type { AlbumInput } from '../services/albumService';

type AlbumProposalModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: AlbumInput) => Promise<boolean>;
  onClose: () => void;
};

export const AlbumProposalModal = ({
  isOpen,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: AlbumProposalModalProps) => {
  return (
    <FormModal
      isOpen={isOpen}
      title="Proponer un álbum"
      hint="Cargá el álbum que falte en Musicboxd. Tu propuesta queda pendiente hasta que un administrador la revise."
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      <AlbumForm
        isSubmitting={isSubmitting}
        submitLabel="Enviar propuesta"
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
