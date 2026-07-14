// Servicio para manejar las llamadas a la API relacionadas con genre
import { Genre } from '../models/Genre.js';

export const genreService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase Genre
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new Genre(...));
    return [];
  }
};
