// Servicio para manejar las llamadas a la API relacionadas con music
import { MusicItem } from '../models/MusicItem.js';

export const musicService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase MusicItem
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new MusicItem(...));
    return [];
  }
};
