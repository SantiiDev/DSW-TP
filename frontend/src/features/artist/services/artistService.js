// Servicio para manejar las llamadas a la API relacionadas con artist
import { Artist } from '../models/Artist.js';

export const artistService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase Artist
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new Artist(...));
    return [];
  }
};
