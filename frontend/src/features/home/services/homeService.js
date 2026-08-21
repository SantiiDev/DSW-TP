// Servicio para manejar las llamadas a la API relacionadas con home
import { HomeData } from '../models/HomeData.js';

export const homeService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase HomeData
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new HomeData(...));
    return [];
  }
};
