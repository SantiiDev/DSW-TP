// Barra de secciones de la ficha de un álbum: "Canciones", "Reseñas" y "Más del
// artista".
//
// No cambia de pantalla ni esconde contenido: la ficha se sigue leyendo de
// corrido y esta barra solo lleva la vista hasta la sección elegida, quedando
// pegada abajo del navbar mientras se baja. Es lo que evita el scroll a ciegas
// en un disco de veinte pistas con treinta reseñas.
//
// El dibujo es el de core/components/Tabs, el mismo del perfil y del panel de
// administración, con su subrayado que se desliza. La pestaña activa no la
// decide el click sino el scroll: al tocar una pestaña la página baja, y el
// subrayado la acompaña sección por sección hasta llegar.
import { useEffect, useState } from 'react';
import { Tabs } from '../../../core/components/Tabs';
import { scrollToSection } from '../../../core/utils/scrollToSection';
import '../styles/_album.scss';

type AlbumSectionNavProps = {
  /**
   * Si la ficha muestra la discografía del artista. Un álbum sin artista
   * cargado no dibuja esa sección, y la barra no puede ofrecer un destino que
   * no existe.
   */
  showDiscography: boolean;
};

/** Una sección de la ficha: el id de su <section> y el texto de la pestaña. */
type Section = { id: string; label: string };

const BASE_SECTIONS: Section[] = [
  { id: 'canciones', label: 'Canciones' },
  { id: 'resenas', label: 'Reseñas' },
];

const DISCOGRAPHY_SECTION: Section = { id: 'discografia', label: 'Más del artista' };

/**
 * Alto de lo que queda fijo arriba (el navbar y esta misma barra), en píxeles,
 * más unos pocos de tolerancia. Una sección se considera alcanzada cuando su
 * borde superior pasa esa línea.
 *
 * Los 142 son el mismo `scroll-margin-top` que _album.scss le da a las secciones
 * (navbar + 78). La tolerancia es necesaria: al hacer click, el scroll deja la
 * sección apoyada JUSTO en esa línea, así que comparando contra el valor exacto
 * la pestaña no se encendía por menos de un píxel de redondeo.
 */
const TOP_OFFSET = 150;

/** Las secciones que tiene esta ficha. @param showDiscography si hay artista. */
function sectionsFor(showDiscography: boolean): Section[] {
  return showDiscography ? [...BASE_SECTIONS, DISCOGRAPHY_SECTION] : BASE_SECTIONS;
}

/**
 * ¿La página ya llegó al final del scroll?
 *
 * Se mira el mayor de los tres valores por el mismo motivo que App.tsx resetea
 * el scroll de los tres: en este proyecto el que scrollea es el <body> y no la
 * ventana (ver base/_reset.scss).
 */
function isAtPageBottom(): boolean {
  const scrolled = Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop
  );
  const total = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return scrolled + window.innerHeight >= total - 2;
}

export const AlbumSectionNav = ({ showDiscography }: AlbumSectionNavProps) => {
  const sections = sectionsFor(showDiscography);
  const [activeId, setActiveId] = useState(BASE_SECTIONS[0].id);

  // Suscribirse al scroll es sincronizar el componente con algo de afuera de
  // React, que es justamente para lo que sirve un efecto. La dependencia es un
  // booleano y no el arreglo, que sería nuevo en cada render y volvería a
  // suscribir sin parar.
  useEffect(() => {
    const handleScroll = () => {
      const current = sectionsFor(showDiscography);

      // Al final de la página la última sección puede no llegar nunca a la línea
      // de arriba (queda poco contenido debajo), pero es la que se está viendo.
      if (isAtPageBottom()) {
        setActiveId(current[current.length - 1].id);
        return;
      }

      // La activa es la última cuyo comienzo ya pasó por debajo de las barras fijas.
      let active = current[0].id;
      for (const section of current) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= TOP_OFFSET) active = section.id;
      }

      setActiveId(active);
    };

    // Una primera vez a mano: si se entra con la página ya scrolleada (por
    // ejemplo al volver atrás), el evento todavía no disparó.
    handleScroll();

    // En fase de captura (el `true`): el scroll lo hace el <body>, y su evento no
    // sube hasta la ventana. Capturando desde window llega igual, venga de donde
    // venga. Es lo mismo que hace core/components/Select.
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDiscography]);

  return (
    <div className="album-nav">
      <div className="album-nav__inner">
        <Tabs
          items={sections}
          activeId={activeId}
          onChange={scrollToSection}
          ariaLabel="Secciones del álbum"
        />
      </div>
    </div>
  );
};
