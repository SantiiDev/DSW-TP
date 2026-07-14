// Modelo de datos para Album (se utiliza para mapear la respuesta de la API)
export class Album {
  constructor(id, title, releaseDate, coverUrl, artistId) {
    this.id = id;
    this.title = title;
    this.releaseDate = releaseDate;
    this.coverUrl = coverUrl;
    this.artistId = artistId;
  }
}
