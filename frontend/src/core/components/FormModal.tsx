// Diálogo con un formulario adentro.
//
// Se distingue del ConfirmDialog de Modal.tsx: ese pregunta sí o no, este abre un
// formulario. Es el marco de las propuestas al catálogo que manda un usuario Pro
// desde su perfil (proponer un álbum, proponer una canción): pone el overlay, la
// cabecera con el botón de cerrar, la aclaración de qué va a pasar con lo que se
// envíe y el lugar donde se muestra el error del intento anterior.
//
// El formulario en sí lo pone cada feature como `children`, porque es lo único
// que cambia entre un diálogo y otro.
//
//   <FormModal isOpen={...} title="Proponer un álbum" hint="..." error={...} onClose={...}>
//     <AlbumForm ... />
//   </FormModal>
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Alert } from './Alert';
import './_form-modal.scss';

type FormModalProps = {
  isOpen: boolean;
  title: string;
  /** Aclaración corta debajo del título. */
  hint?: string;
  /** Mensaje del último intento fallido, o null si todavía no falló nada. */
  error?: string | null;
  /**
   * true mientras se está enviando: bloquea el cierre para que no se pierda lo
   * escrito con un click al costado a mitad de camino.
   */
  isBusy?: boolean;
  children: ReactNode;
  onClose: () => void;
};

export const FormModal = ({
  isOpen,
  title,
  hint,
  error = null,
  isBusy = false,
  children,
  onClose,
}: FormModalProps) => {
  // Escape cierra, como en cualquier diálogo del sitio. El listener se engancha
  // solo mientras está abierto para no quedar escuchando de más.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  // Mientras el diálogo está abierto, la página de atrás no scrollea. Sin esto,
  // sobre una tabla larga (el panel de administración) la rueda mueve el listado
  // del fondo en vez del formulario, que es lo único con lo que se está
  // trabajando. Al cerrar se restaura lo que hubiera, que puede no ser vacío.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // El click en el fondo cierra; adentro de la tarjeta se frena la propagación
    // para que hacer click en el formulario no cierre el diálogo sin querer.
    <div className="form-modal-overlay" onClick={isBusy ? undefined : onClose}>
      <div
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="form-modal__header">
          <h3 id="form-modal-title" className="form-modal__title">
            {title}
          </h3>
          <button
            type="button"
            className="form-modal__close"
            aria-label="Cerrar"
            disabled={isBusy}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {hint && <p className="form-modal__hint">{hint}</p>}

        {error && <Alert tone="error">{error}</Alert>}

        {children}
      </div>
    </div>
  );
};
