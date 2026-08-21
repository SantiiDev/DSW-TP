// Modelo de datos para Membership (se utiliza para mapear la respuesta de la API)
export class Membership {
  constructor(id, type, price, benefits) {
    this.id = id;
    this.type = type;
    this.price = price;
    this.benefits = benefits;
  }
}
