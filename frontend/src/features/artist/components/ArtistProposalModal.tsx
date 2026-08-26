// Modal para proponer un artista nuevo desde la pestaña "Aportes" del perfil.
//
// Adentro va el mismo ArtistForm que usa el panel de administración; lo único que
// agrega es el marco del diálogo y el lugar donde se muestra el error del intento
// anterior (por ejemplo, que ese artista ya esté cargado), para que el usuario
// pueda corregir el nombre sin perder lo que escribió.
//
// El overlay es propio de la feature, igual que hace AuthModal en la feature user.
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Alert } from '../../../core/components/Alert';
import { ArtistForm } from './ArtistForm';
import type { ArtistInput } from '../services/artistService';
import '../styles/_artist.scss';

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
  // Escape cierra, como en cualquier diálogo del sitio. El listener se engancha
  // solo mientras está abierto para no quedar escuchando de más.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    // El click en el fondo cierra; adentro de la tarjeta se frena la propagación
    // para que hacer click en el formulario no cierre el diálogo sin querer.
    <div className="artist-modal-overlay" onClick={isSubmitting ? undefined : onClose}>
      <div
        className="artist-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="artist-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="artist-modal__header">
          <h3 id="artist-modal-title" className="artist-modal__title">
            Proponer un artista
          </h3>
          <button
            type="button"
            className="artist-modal__close"
            aria-label="Cerrar"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <p className="artist-modal__hint">
          Cargá el artista que falte en Musicboxd. Tu propuesta queda pendiente hasta que un
          administrador la revise.
        </p>

        {error && <Alert tone="error">{error}</Alert>}

        <ArtistForm
          isSubmitting={isSubmitting}
          submitLabel="Enviar propuesta"
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
