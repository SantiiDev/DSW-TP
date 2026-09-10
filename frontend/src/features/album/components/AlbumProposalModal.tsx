// Modal de la pestaña "Aportes" del perfil: sirve para proponer un álbum nuevo y
// para corregir una propuesta propia que todavía no se aprobó.
//
// Adentro va el mismo AlbumForm que usa el panel de administración; el marco del
// diálogo (overlay, cabecera, aclaración y el lugar del error) lo pone FormModal,
// que es el mismo que usa la propuesta de canción.
import { FormModal } from '../../../core/components/FormModal';
import { AlbumForm } from './AlbumForm';
import type { AlbumInput } from '../services/albumService';
import type { Album } from '../models/Album';

type AlbumProposalModalProps = {
  isOpen: boolean;
  /**
   * Aporte que se está editando, o null si es una propuesta nueva. Es lo único
   * que separa los dos modos del modal.
   */
  album?: Album | null;
  isSubmitting: boolean;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error: string | null;
  /** Devuelve true si la propuesta se envió; con eso el padre cierra el modal. */
  onSubmit: (input: AlbumInput) => Promise<boolean>;
  onClose: () => void;
};

/** Pasa un álbum ya cargado a los valores que espera el formulario. */
function toFormValues(album: Album): AlbumInput {
  return {
    title: album.title,
    release_year: album.releaseYear === null ? '' : String(album.releaseYear),
    url_cover: album.urlCover ?? '',
    id_artist: album.artist?.id ?? 0,
    genre_ids: album.genres.map((genre) => genre.id),
  };
}

export const AlbumProposalModal = ({
  isOpen,
  album = null,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}: AlbumProposalModalProps) => {
  const isEditing = album !== null;

  return (
    <FormModal
      isOpen={isOpen}
      title={isEditing ? `Editar la propuesta de ${album.title}` : 'Proponer un álbum'}
      hint={
        isEditing
          ? 'Corregí lo que haga falta. El aporte vuelve a quedar pendiente para que un administrador lo revise de nuevo.'
          : 'Cargá el álbum que falte en Musicboxd. Tu propuesta queda pendiente hasta que un administrador la revise.'
      }
      error={error}
      isBusy={isSubmitting}
      onClose={onClose}
    >
      {/* La key remonta el formulario al pasar de un aporte a otro (o de editar a
          proponer): los valores iniciales se leen una sola vez, al montar. */}
      <AlbumForm
        key={album?.id ?? 'new'}
        initialValues={album ? toFormValues(album) : undefined}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? 'Guardar cambios' : 'Enviar propuesta'}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
};
