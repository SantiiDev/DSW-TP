// Lleva la vista hasta una sección de la página por su id, con un deslizamiento
// suave. Lo usan la barra de secciones de la ficha de un álbum y los botones que
// mandan al formulario de reseña.
//
// El margen que hay que dejarle a las barras fijas de arriba lo pone el CSS de
// cada sección con `scroll-margin-top`, que scrollIntoView ya respeta.

/**
 * Desliza la vista hasta la sección indicada.
 * @param id id del elemento de destino. Si no existe, no hace nada.
 */
export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
