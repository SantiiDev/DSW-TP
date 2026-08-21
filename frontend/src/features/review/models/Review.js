// Modelo de datos para Review (se utiliza para mapear la respuesta de la API)
export class Review {
  constructor(id, text, rating, userId, albumId) {
    this.id = id;
    this.text = text;
    this.rating = rating;
    this.userId = userId;
    this.albumId = albumId;
  }
}
