// Servicio para manejar las llamadas a la API relacionadas con membership
import { Membership } from '../models/Membership.js';

export const membershipService = {
  // Simula una llamada HTTP que retorna datos parseados a clase
  getAll: async () => {
    // Aquí iría el fetch real y el mapeo a la clase Membership
    // const response = await fetch('...');
    // const data = await response.json();
    // return data.map(item => new Membership(...));
    return [];
  }
};
