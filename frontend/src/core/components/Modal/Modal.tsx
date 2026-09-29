// Diálogo de confirmación reutilizable.
//
// Reemplaza al window.confirm del navegador, que no se puede estilar y rompe el
// look del sitio. Lo usan el cierre de sesión, la baja de cuenta propia y la
// eliminación de usuarios desde el panel de administración.
//
//   <ConfirmDialog
//     isOpen={...}
//     title="Cerrar sesión"
//     message="¿Seguro que querés salir de tu cuenta?"
//     onConfirm={...}
//     onCancel={...}
//   />
import { useEffect } from 'react';
import { Button } from './Button';
import './_modal.scss';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta el botón de confirmar en rojo, para acciones destructivas. */
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  // Escape cancela, como en cualquier diálogo del sistema. El listener se
  // engancha solo mientras está abierto para no quedar escuchando de más.
  //
  // Va en fase de CAPTURA (el `true`) y corta la propagación porque este diálogo
  // puede aparecer arriba de un FormModal: por ejemplo el aviso de artistas
  // parecidos, que sale desde adentro del formulario de alta. Los dos escuchan
  // en window, y el de abajo enganchó su listener primero, así que en fase de
  // burbuja se llevaría el Escape y cerraría el formulario entero con lo que el
  // usuario venía escribiendo. La captura corre antes, sin importar el orden en
  // que se engancharon.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      e.stopPropagation();
      onCancel();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    // El click en el fondo cancela; dentro de la tarjeta se frena la propagación
    // para que hacer click en el texto no cierre el diálogo sin querer.
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="modal__title">
          {title}
        </h2>
        <p className="modal__message">{message}</p>

        <div className="modal__actions">
          <Button variant="subtle" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {/* En una acción destructiva el botón de confirmar va en rojo, para que
              no se apriete de memoria como si fuera un "aceptar" cualquiera. */}
          <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
