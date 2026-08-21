// Modelo de datos para HomeData (se utiliza para mapear la respuesta de la API)
export class HomeData {
  constructor(popularAlbums, featuredArtists) {
    this.popularAlbums = popularAlbums;
    this.featuredArtists = featuredArtists;
  }
}
