// Fondo animado de la llamada a la acción de la página de inicio.
//
// Cuatro capas de SVG, todas sobre el tema de la música: un ecualizador que late
// a lo largo del borde de abajo, dos ondas de sonido que corren de lado a lado,
// un vinilo girando asomado por la derecha y notas musicales que suben y se
// desvanecen. El movimiento lo hace el CSS (_cta-backdrop.scss); acá solo se
// dibujan las formas.
//
// Es decorativo: va con aria-hidden para que el lector de pantalla lo saltee, y
// con `prefers-reduced-motion` se queda quieto.
import type { CSSProperties } from 'react';
import './_cta-backdrop.scss';

/** Cuántas barras tiene el ecualizador. */
const BAR_COUNT = 48;

/**
 * Duraciones (en segundos) y alturas de reposo de las barras. Se recorren en
 * ciclo según la posición de cada barra: así cada una late a su propio ritmo sin
 * tener que usar Math.random, que cambiaría el dibujo en cada render.
 */
const BAR_DURATIONS = [1.1, 0.8, 1.4, 0.9, 1.2, 0.7, 1.3, 1.0, 0.85, 1.25];
const BAR_HEIGHTS = [0.55, 0.8, 0.4, 0.95, 0.6, 0.75, 0.45, 0.9, 0.5, 0.7];

/**
 * Notas que suben. `left` es la posición horizontal (en % de la caja), `size` el
 * alto en px y `delay`/`duration` el ritmo. Van en los costados y no en el medio,
 * que es donde está el texto.
 */
const NOTES = [
  { kind: 'single', left: 6, size: 30, delay: 0, duration: 9 },
  { kind: 'double', left: 16, size: 38, delay: 3.5, duration: 11 },
  { kind: 'single', left: 26, size: 22, delay: 6, duration: 8 },
  { kind: 'double', left: 72, size: 32, delay: 1.5, duration: 10 },
  { kind: 'single', left: 82, size: 26, delay: 5, duration: 9.5 },
  { kind: 'single', left: 92, size: 34, delay: 7.5, duration: 12 },
] as const;

/**
 * Arma el trazo de una onda: medias ondas alternadas hacia arriba y hacia abajo,
 * cada una una curva cuadrática, sobre un lienzo de 1000 × 100.
 *
 * @param periods cuántas ondas completas entran en el lienzo. Tiene que ser par:
 *   el SVG mide el doble de la caja y se corre la mitad de su ancho, así que las
 *   dos mitades tienen que ser idénticas para que el salto del final no se note.
 * @param amplitude cuánto sube y baja la onda desde el centro (0 a 50).
 */
function buildWavePath(periods: number, amplitude: number): string {
  const halfStep = 1000 / (periods * 2);
  let path = 'M 0 50';

  for (let i = 0; i < periods * 2; i++) {
    const end = halfStep * (i + 1);
    const peak = i % 2 === 0 ? 50 - amplitude : 50 + amplitude;
    path += ` Q ${end - halfStep / 2} ${peak} ${end} 50`;
  }

  return path;
}

const WAVE_FRONT = buildWavePath(6, 30);
const WAVE_BACK = buildWavePath(4, 18);

/** Una corchea (♪): cabeza, plica y banderita. */
const SingleNote = () => (
  <svg viewBox="0 0 24 32">
    <ellipse cx="8" cy="26" rx="6" ry="4.5" transform="rotate(-20 8 26)" />
    <rect x="12.5" y="3" width="2" height="23" />
    <path d="M14.5 3 C 20 6, 22 10, 19 15 C 20 11, 18 8.5, 14.5 8 Z" />
  </svg>
);

/** Dos corcheas unidas por una barra (♫). */
const DoubleNote = () => (
  <svg viewBox="0 0 32 32">
    <ellipse cx="7" cy="26" rx="5.5" ry="4" transform="rotate(-20 7 26)" />
    <ellipse cx="24" cy="23" rx="5.5" ry="4" transform="rotate(-20 24 23)" />
    <rect x="10.8" y="5" width="2" height="21" />
    <rect x="27.8" y="2" width="2" height="21" />
    <path d="M10.8 5 L29.8 2 L29.8 6.5 L10.8 9.5 Z" />
  </svg>
);

export const CtaBackdrop = () => {
  return (
    <div className="cta-backdrop" aria-hidden="true">
      {/* Ondas de sonido. El SVG mide el doble de la caja y se desliza la mitad
          de su ancho en bucle: como las dos mitades son iguales, la onda parece
          correr para siempre. */}
      <svg
        className="cta-backdrop__wave cta-backdrop__wave--back"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path d={WAVE_BACK} />
      </svg>
      <svg
        className="cta-backdrop__wave cta-backdrop__wave--front"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path d={WAVE_FRONT} />
      </svg>

      {/* Vinilo: el disco con sus surcos y la etiqueta verde del centro. La marca
          blanca de la etiqueta es la que deja ver que está girando. */}
      <svg className="cta-backdrop__vinyl" viewBox="0 0 200 200">
        <circle className="cta-backdrop__vinyl-disc" cx="100" cy="100" r="98" />
        {[88, 78, 68, 58, 48].map((r) => (
          <circle key={r} className="cta-backdrop__vinyl-groove" cx="100" cy="100" r={r} />
        ))}
        <circle className="cta-backdrop__vinyl-label" cx="100" cy="100" r="30" />
        <rect className="cta-backdrop__vinyl-mark" x="98" y="74" width="4" height="12" rx="2" />
        <circle className="cta-backdrop__vinyl-hole" cx="100" cy="100" r="4" />
      </svg>

      {/* Ecualizador a lo largo del borde de abajo. Cada barra recibe su ritmo y
          su altura por variables CSS, así el CSS tiene una sola animación. */}
      <svg
        className="cta-backdrop__equalizer"
        viewBox={`0 0 ${BAR_COUNT * 10} 100`}
        preserveAspectRatio="none"
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <rect
            key={i}
            className="cta-backdrop__bar"
            x={i * 10 + 2}
            y="0"
            width="6"
            height="100"
            style={
              {
                '--bar-duration': `${BAR_DURATIONS[i % BAR_DURATIONS.length]}s`,
                '--bar-height': BAR_HEIGHTS[i % BAR_HEIGHTS.length],
                // Un retraso distinto por barra para que no arranquen todas juntas.
                '--bar-delay': `${-((i * 0.37) % 1.4)}s`,
              } as CSSProperties
            }
          />
        ))}
      </svg>

      {/* Notas que suben desde abajo y se desvanecen. */}
      {NOTES.map((note, i) => (
        <span
          key={i}
          className="cta-backdrop__note"
          style={
            {
              left: `${note.left}%`,
              '--note-size': `${note.size}px`,
              '--note-delay': `${note.delay}s`,
              '--note-duration': `${note.duration}s`,
            } as CSSProperties
          }
        >
          {note.kind === 'single' ? <SingleNote /> : <DoubleNote />}
        </span>
      ))}
    </div>
  );
};
