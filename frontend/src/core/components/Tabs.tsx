// Barra de pestañas horizontal, reutilizable por cualquier feature.
//
// La usan el perfil (ProfileTabs) y el panel de administración (AdminPage): en vez
// de repetir el markup y los estilos en cada uno, las dos pantallas comparten este
// componente y por lo tanto se ven exactamente igual.
//
// Es presentacional: no decide qué pestañas existen ni cuál corresponde mostrar,
// solo dibuja las que recibe y avisa cuál se clickeó.
//
// El subrayado verde es UNO solo para toda la barra y se desliza hasta la pestaña
// elegida, igual que la pastilla del conmutador de vista (ViewSwitcher). Acá no
// alcanza con el truco de CSS que usa aquel —celdas de igual ancho y correrse un
// 100%— porque las pestañas miden lo que mide su texto: hay que preguntarle a la
// activa dónde está. Eso es lo único que hace el efecto de abajo.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './_tabs.scss';

/** Una pestaña: el id con el que la identifica el padre y el texto que se ve. */
export type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  /** Id de la pestaña activa. */
  activeId: string;
  onChange: (id: string) => void;
  /** Describe de qué sección son las pestañas, para lectores de pantalla. */
  ariaLabel: string;
};

/** Dónde arranca y cuánto mide la pestaña activa, en píxeles. */
type Underline = { left: number; width: number };

export const Tabs = ({ items, activeId, onChange, ariaLabel }: TabsProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  // width 0 hasta la primera medición: así el subrayado no aparece en el borde
  // izquierdo antes de saber a dónde va.
  const [underline, setUnderline] = useState<Underline>({ left: 0, width: 0 });

  // Las pestañas que hay, como texto. Sirve de dependencia estable del efecto:
  // `items` es un array nuevo en cada render (los padres lo arman con un .map),
  // y usarlo directamente volvería a medir para siempre.
  const itemsKey = items.map((tab) => tab.id).join('|');

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    /**
     * Le pregunta al botón activo dónde está y mueve el subrayado ahí.
     *
     * Se miden offsetLeft y offsetWidth y no getBoundingClientRect porque son
     * relativos a la lista, que es de quien cuelga el subrayado: así la cuenta
     * sigue siendo válida cuando la barra scrollea en horizontal.
     */
    const measure = () => {
      const active = list.querySelector<HTMLElement>('.tabs__tab--active');
      if (active) setUnderline({ left: active.offsetLeft, width: active.offsetWidth });
    };

    measure();

    // El ancho de una pestaña cambia si cambia el de la ventana (la tipografía
    // se reajusta, la barra pasa a scrollear): hay que volver a medir.
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeId, itemsKey]);

  // Mientras las fuentes no terminan de cargar, el texto se mide con la
  // tipografía de reserva y las pestañas cambian de ancho después del primer
  // render. Se vuelve a medir cuando están listas.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !document.fonts) return;

    void document.fonts.ready.then(() => {
      const active = list.querySelector<HTMLElement>('.tabs__tab--active');
      if (active) setUnderline({ left: active.offsetLeft, width: active.offsetWidth });
    });
  }, []);

  return (
    // El wrapper permite scroll horizontal: en mobile las pestañas no entran.
    <nav className="tabs" aria-label={ariaLabel}>
      <ul
        className="tabs__list"
        ref={listRef}
        // Las dos medidas van como variables CSS y no como estilos ya
        // calculados: dónde termina de apoyarse el subrayado (que va un poco
        // más angosto que la pestaña) es una decisión de la hoja de estilos.
        style={
          {
            '--tab-left': underline.left,
            '--tab-width': underline.width,
          } as CSSProperties
        }
      >
        {/* El subrayado, uno solo para toda la barra: al cambiar de pestaña se
            desliza hasta la nueva en vez de apagarse acá y prenderse allá.
            Decorativo: cuál está activa ya lo dice el aria-current del botón. */}
        <span className="tabs__underline" aria-hidden="true" />

        {items.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={`tabs__tab ${activeId === tab.id ? 'tabs__tab--active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-current={activeId === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
