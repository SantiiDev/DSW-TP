// Normalización de texto para búsquedas que no distinguen mayúsculas ni acentos.

/**
 * Normaliza un texto para poder buscarlo: minúsculas y sin acentos, así "Bailá"
 * se encuentra escribiendo "baila".
 *
 * NFD separa cada letra acentuada en letra + acento aparte ("á" pasa a ser "a" +
 * tilde), y el filtro siguiente borra ese acento suelto.
 *
 * @param text texto original.
 * @returns el mismo texto en minúsculas y sin acentos.
 */
export function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      // \p{Diacritic} son justamente esos acentos sueltos. Se usa la clase
      // Unicode y no el rango de caracteres literales, que en el editor se ven
      // como espacios y cualquiera los borraría sin querer.
      .replace(/\p{Diacritic}/gu, '')
  );
}
