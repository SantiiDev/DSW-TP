// Modelo de datos para Artist (se utiliza para mapear la respuesta de la API)
export class Artist {
  constructor(id, name, bio, imageUrl) {
    this.id = id;
    this.name = name;
    this.bio = bio;
    this.imageUrl = imageUrl;
  }
}
