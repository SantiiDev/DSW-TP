// Modelo de datos para User (se utiliza para mapear la respuesta de la API)
export class User {
  constructor(id, username, email, avatarUrl) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatarUrl = avatarUrl;
  }
}
