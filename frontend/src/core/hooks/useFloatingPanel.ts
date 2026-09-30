// Posición de un panel flotante (un desplegable) pegado a su botón.
//
// El panel es `position: fixed` y va montado en el <body> con un portal, no
// dentro del componente. Si fuera un hijo con position:absolute, cualquier
// contenedor con overflow (por ejemplo el wrapper con scroll de la tabla de
// usuarios) le recortaría el panel al abrirlo. A cambio, hay que calcular a mano
// dónde va y recalcularlo cuando la página scrollea.
import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Alto máximo del panel. Se usa para decidir si abrirlo hacia abajo o hacia
// arriba según el espacio que quede en pantalla, así que alcanza con que sea una
// estimación del alto real.
const MAX_PANEL_HEIGHT = 300;

// Separación entre el botón y el panel.
const PANEL_GAP = 4;

// Ancho máximo del panel (tiene que coincidir con el max-width del CSS). Se usa
// para que, cuando el panel crece más que el botón, no se salga de la pantalla.
const MAX_PANEL_WIDTH = 320;

// Aire mínimo contra el borde de la ventana.
const VIEWPORT_MARGIN = 8;

/** Posición del panel en la ventana. */
export type PanelPosition = {
  left: number;
  /**
   * El panel arranca del ancho del botón, pero crece si alguna opción no entra:
   * las opciones tienen que poder leerse enteras aunque el botón sea angosto.
   * El techo lo pone MAX_PANEL_WIDTH.
   */
  minWidth: number;
  /** Se usa uno u otro según hacia dónde se abra. */
  top?: number;
  bottom?: number;
};

/**
 * Calcula dónde dibujar el panel a partir de la posición del botón en pantalla.
 * @param trigger el botón al que se pega el panel.
 */
function computePosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  // Si abajo no entra pero arriba sí, se abre hacia arriba (típico de las
  // últimas filas de una tabla larga).
  const opensUpwards = spaceBelow < MAX_PANEL_HEIGHT && rect.top > spaceBelow;

  // El panel puede terminar más ancho que el botón, así que se corre a la
  // izquierda si con ese ancho llegaría a pasarse del borde de la ventana.
  const maxLeft = window.innerWidth - MAX_PANEL_WIDTH - VIEWPORT_MARGIN;

  return {
    left: Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft)),
    minWidth: rect.width,
    ...(opensUpwards
      ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
      : { top: rect.bottom + PANEL_GAP }),
  };
}

/**
 * @param triggerRef el botón al que se pega el panel.
 * @param isOpen si el panel está abierto: solo entonces se sigue el scroll.
 * @returns la posición calculada y la función para recalcularla (se llama al abrir).
 */
export function useFloatingPanel(triggerRef: RefObject<HTMLElement | null>, isOpen: boolean) {
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const updatePosition = () => {
    if (triggerRef.current) setPosition(computePosition(triggerRef.current));
  };

  // El panel está en el <body> con position: fixed, así que no acompaña solo al
  // botón cuando la página (o la tabla) scrollea: hay que recalcularlo.
  // El `true` es la fase de captura, para enterarse también del scroll de los
  // contenedores internos, que no burbujea.
  useEffect(() => {
    if (!isOpen) return;

    const handleMove = () => {
      if (triggerRef.current) setPosition(computePosition(triggerRef.current));
    };

    window.addEventListener('scroll', handleMove, true);
    window.addEventListener('resize', handleMove);

    return () => {
      window.removeEventListener('scroll', handleMove, true);
      window.removeEventListener('resize', handleMove);
    };
  }, [isOpen, triggerRef]);

  return { position, updatePosition };
}
