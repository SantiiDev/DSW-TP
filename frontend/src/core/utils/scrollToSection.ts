// Lleva la vista hasta una sección de la página por su id.
//
// Vive en core y no dentro de una feature porque no sabe nada del dominio: lo
// usan la barra de secciones de la ficha de un álbum y los botones que mandan al
// formulario de reseña, y cualquier pantalla larga puede necesitarlo.
//
// El margen que hay que dejarle a las barras fijas de arriba no se calcula acá:
// lo pone el CSS de cada sección con `scroll-margin-top`.

/**
 * Scrollea hasta la sección indicada, con animación.
 * @param id id del elemento de destino. Si no existe, no hace nada.
 */
export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
