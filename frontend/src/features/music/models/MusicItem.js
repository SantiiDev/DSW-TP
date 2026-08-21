// Modelo de datos para MusicItem (se utiliza para mapear la respuesta de la API)
export class MusicItem {
  constructor(id, title, type) {
    this.id = id;
    this.title = title;
    this.type = type;
  }
}
