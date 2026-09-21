// Copia un enlace al portapapeles y avisa que se copió por unos segundos.
//
// Es el botón "Compartir" que aparece en varias pantallas del sitio: la tarjeta
// de una reseña, el panel de una reseña, la ficha de un álbum, el perfil de un
// usuario y las listas. La lógica era la misma en todos lados —el estado
// `copied`, el reloj que lo apaga y el catch del portapapeles bloqueado—, así
// que vive acá una sola vez.
//
//   const { copied, copy } = useCopyLink();
//   <button onClick={() => copy(list.sharePath)}>
//     {copied ? '¡Copiado!' : 'Compartir'}
//   </button>
import { useEffect, useRef, useState } from 'react';

/** Cuánto dura el "¡Copiado!" del botón, en milisegundos. */
const COPIED_FEEDBACK_MS = 2000;

export function useCopyLink() {
  const [copied, setCopied] = useState(false);
  // Se guarda el reloj para poder cancelarlo: sin esto, desmontar el componente
  // mientras el aviso está en pantalla dejaría un setState sobre algo que ya no
  // existe (pasa al compartir y navegar enseguida).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Copia un enlace del sitio al portapapeles.
   *
   * @param path ruta interna a compartir (por ejemplo "/lists/3"). El dominio lo
   *   pone el origen actual, así el enlace sirve igual en desarrollo y en
   *   producción sin hardcodear nada. Sin argumento copia la URL de la página en
   *   la que se está.
   */
  const copy = async (path?: string): Promise<void> => {
    const url = path === undefined ? window.location.href : `${window.location.origin}${path}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Si el navegador bloquea el portapapeles (pasa sin HTTPS) no se rompe
      // nada: el usuario todavía puede copiar la URL de la barra de direcciones.
      setCopied(false);
    }
  };

  return { copied, copy };
}
