// Ayuda para las búsquedas por texto con LIKE.
//
// Lo usan todas las búsquedas que arman un patrón con lo que escribió el usuario:
// usuarios por nombre, y álbumes y canciones por título.
import { literal, OrderItem } from 'sequelize';
import { sequelize } from './sequelize';

/**
 * Escapa los comodines de LIKE en lo que escribió el usuario. Sin esto, buscar
 * "%" traería todas las filas y "_" coincidiría con cualquier letra.
 *
 * El carácter de escape es la barra invertida, que es el que usa MySQL por defecto.
 *
 * @param text texto tal como lo escribió el usuario.
 * @returns el mismo texto, listo para ir entre comodines: `%${escapeLike(q)}%`.
 */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Criterio de orden que pone primero las filas cuya columna EMPIEZA con el texto
 * buscado: quien escribe "in" casi seguro busca "Infame" antes que
 * "(Rotten Apples)...". Va como primer elemento del ORDER BY de una búsqueda.
 *
 * @param column columna ya calificada, por ejemplo "`Album`.`title`".
 * @param text texto tal como lo escribió el usuario.
 */
export function startsWithFirst(column: string, text: string): OrderItem {
  // El patrón se escapa dos veces: primero los comodines de LIKE y después el
  // valor entero con sequelize.escape, que es lo que evita inyectar SQL.
  const pattern = sequelize.escape(`${escapeLike(text)}%`);
  return [literal(`CASE WHEN ${column} LIKE ${pattern} THEN 0 ELSE 1 END`), 'ASC'];
}
