// Servicio para manejar las llamadas a la API relacionadas con music
import { MusicItem } from '../models/MusicItem.js';

export const musicService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase MusicItem
    // const apiUrl = import.meta.env.VITE_API_URL;
    // const response = await fetch(`${apiUrl}/music`);
    // const data = await response.json();
    // return data.map(item => new MusicItem(...));
    return [];
  }
};
