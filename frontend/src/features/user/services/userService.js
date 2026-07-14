// Servicio para manejar las llamadas a la API relacionadas con user
import { User } from '../models/User.js';

export const userService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase User
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new User(...));
    return [];
  }
};
