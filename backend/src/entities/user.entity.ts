// Entidad USERS.
// USERS (id_user, username, email, password, rol, url_avatar, registration_date,
//        is_active)
//   id_user -> PK
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { USER_ROLES, UserRole } from '../shared/types/enums';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id_user: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare rol: CreationOptional<UserRole>;
  declare url_avatar: CreationOptional<string | null>;
  declare registration_date: CreationOptional<Date>;
  declare is_active: CreationOptional<boolean>;
}

User.init(
  {
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // El índice único va declarado abajo, en `indexes`, y NO acá con
      // `unique: true`. Ver la nota al pie de este archivo.
      validate: { len: { args: [3, 50], msg: 'El nombre de usuario debe tener entre 3 y 50 caracteres.' } },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { isEmail: { msg: 'El email no tiene un formato válido.' } },
    },
    password: {
      // Guarda el hash de bcrypt, nunca la contraseña en texto plano.
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: 'FREE',
    },
    url_avatar: {
      // Link a la foto de perfil, igual que ALBUMS.url_cover. Guardamos la URL y
      // no el archivo: el proyecto no maneja subida ni almacenamiento de imágenes.
      // En null, el frontend dibuja el avatar por defecto.
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      // Baja lógica: una cuenta dada de baja no se borra de la tabla, se marca
      // en false. Así no se pierden sus reseñas, pagos ni suscripciones, que la
      // referencian por FK, y un ADMIN la puede volver a activar cuando quiera.
      // Mientras esté en false no puede iniciar sesión (ver auth.service.ts).
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    // Índices únicos declarados CON NOMBRE, en vez de `unique: true` en la columna.
    //
    // Por qué: al arrancar con DB_SYNC=true se corre sequelize.sync({ alter: true }).
    // Un `unique: true` en la columna genera un índice sin nombre, que Sequelize no
    // reconoce como "ya existente" en el arranque siguiente, así que crea otro. A
    // razón de uno por reinicio la tabla llega a los 64 índices que permite MySQL y
    // el servidor deja de arrancar con ER_TOO_MANY_KEYS. Con el índice nombrado, en
    // cambio, lo encuentra y no lo duplica.
    indexes: [
      { name: 'users_username_unique', unique: true, fields: ['username'] },
      { name: 'users_email_unique', unique: true, fields: ['email'] },
    ],
    // El scope por defecto excluye la contraseña de TODA consulta, para que no haya
    // forma de filtrarla por accidente en una respuesta de la API.
    // Para el login se usa explícitamente User.scope('withPassword').
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  }
);
