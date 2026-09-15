// Lleva la vista hasta una sección de la página por su id, con un deslizamiento
// suave.
//
// Vive en core y no dentro de una feature porque no sabe nada del dominio: lo
// usan la barra de secciones de la ficha de un álbum y los botones que mandan al
// formulario de reseña, y cualquier pantalla larga puede necesitarlo.
//
// No usa `scrollIntoView({ behavior: 'smooth' })`: el navegador decide solo cuánto
// dura ese movimiento y en un salto largo (del tracklist a la discografía) se
// sentía brusco. Acá la animación es propia, cuadro a cuadro, con el mismo
// mecanismo que el contador de core/components/charts/StatNumber.
//
// El margen que hay que dejarle a las barras fijas de arriba no se calcula acá:
// lo pone el CSS de cada sección con `scroll-margin-top`, y se lee de ahí.

/** Lo mínimo y lo máximo que puede durar el deslizamiento, en milisegundos. */
const MIN_DURATION_MS = 450;
const MAX_DURATION_MS = 1000;

/**
 * Corta la animación en curso, o null si no hay ninguna. Es una sola para toda
 * la app: si se pide ir a otra sección antes de llegar, la animación vieja se
 * corta (con sus listeners) en vez de pelearse con la nueva.
 */
let stopCurrent: (() => void) | null = null;

/** Arranca y termina despacio, y va más rápido en el medio. */
function easeInOutCubic(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

/**
 * Cuánto está scrolleada la página.
 *
 * Se mira el mayor de los tres por el mismo motivo que App.tsx resetea el scroll
 * de los tres: en este proyecto el que scrollea es el <body> y no la ventana (ver
 * base/_reset.scss), y así el código sigue andando si eso cambia algún día.
 */
function getScrollTop(): number {
  return Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
}

/** Mueve el scroll de la página a una posición, sin animación. */
function setScrollTop(top: number): void {
  window.scrollTo(0, top);
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

/**
 * Desliza la vista hasta la sección indicada.
 * @param id id del elemento de destino. Si no existe, no hace nada.
 */
export function scrollToSection(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;

  stopCurrent?.();

  const start = getScrollTop();
  const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  const maxScroll =
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
    window.innerHeight;
  // Si la sección está muy abajo, la página no puede subirla hasta arriba: el
  // destino se corta en el final del scroll para no animar hacia un lugar al que
  // nunca se llega.
  const target = Math.min(
    Math.max(start + element.getBoundingClientRect().top - margin, 0),
    maxScroll
  );
  const distance = Math.abs(target - start);

  // A diferencia de las demás animaciones del sitio, esta NO se apaga con la
  // preferencia "reducir movimiento" del sistema: fue una decisión del equipo,
  // porque un salto seco pierde la referencia de hacia dónde se movió la página.
  if (distance < 1) return;

  // Un salto corto dura menos que uno largo, dentro de los dos límites: con una
  // duración fija, bajar dos canciones se sentía lento y cruzar la ficha entera,
  // apurado.
  const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, distance * 0.6));

  let frame = 0;

  // Si el usuario mueve la rueda o toca la pantalla a mitad de camino, manda él:
  // la animación se corta en vez de arrastrarle el scroll.
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    stopCurrent = null;
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  stopCurrent = stop;

  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    setScrollTop(start + (target - start) * easeInOutCubic(progress));

    if (progress < 1) frame = requestAnimationFrame(tick);
    else stop();
  };

  frame = requestAnimationFrame(tick);
}
