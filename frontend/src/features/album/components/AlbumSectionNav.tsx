// Barra de secciones de la ficha de un álbum: "Canciones", "Reseñas" y "Más del
// artista".
//
// No cambia de pantalla ni esconde contenido: la ficha se sigue leyendo de
// corrido y esta barra solo lleva la vista hasta la sección elegida, quedando
// pegada abajo del navbar mientras se baja. Es lo que evita el scroll a ciegas
// en un disco de veinte pistas con treinta reseñas.
//
// Cuál está resaltada se calcula mirando el scroll: la activa es la última
// sección cuyo comienzo ya pasó por debajo de las dos barras fijas.
import { useEffect, useState } from 'react';
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

export const AlbumSectionNav = ({ showDiscography }: AlbumSectionNavProps) => {
  const sections = sectionsFor(showDiscography);
  const [activeId, setActiveId] = useState(BASE_SECTIONS[0].id);

  // Suscribirse al scroll de la ventana es sincronizar el componente con algo de
  // afuera de React, que es justamente para lo que sirve un efecto. La
  // dependencia es un booleano y no el arreglo, que sería nuevo en cada render y
  // volvería a suscribir sin parar.
  useEffect(() => {
    const handleScroll = () => {
      let current = BASE_SECTIONS[0].id;

      for (const section of sectionsFor(showDiscography)) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= TOP_OFFSET) current = section.id;
      }

      setActiveId(current);
    };

    // Una primera vez a mano: si se entra con la página ya scrolleada (por
    // ejemplo al volver atrás), el evento todavía no disparó.
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showDiscography]);

  return (
    <nav className="album-nav" aria-label="Secciones del álbum">
      <ul className="album-nav__list">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={`album-nav__tab ${activeId === section.id ? 'album-nav__tab--active' : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
