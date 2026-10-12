// Entidad USERS.
// USERS (id_user, username, email, password, rol, state, url_avatar, url_banner,
//        banner_position, profile_color, registration_date)
//   id_user -> PK
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import {
  PROFILE_COLORS,
  ProfileColor,
  USER_ROLES,
  USER_STATES,
  UserRole,
  UserState,
} from '../shared/types/enums';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id_user: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare rol: CreationOptional<UserRole>;
  declare state: CreationOptional<UserState>;
  declare url_avatar: CreationOptional<string | null>;
  declare url_banner: CreationOptional<string | null>;
  declare banner_position: CreationOptional<number>;
  declare profile_color: CreationOptional<ProfileColor | null>;
  declare registration_date: CreationOptional<Date>;
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
    state: {
      // Baja lógica: dar de baja una cuenta la deja en 'suspended', nunca borra
      // la fila. Toda cuenta nueva arranca activa.
      type: DataTypes.ENUM(...USER_STATES),
      allowNull: false,
      defaultValue: 'active',
    },
    url_avatar: {
      // Link a la foto de perfil, igual que ALBUMS.url_cover. Guardamos la URL y
      // no el archivo: el proyecto no maneja subida ni almacenamiento de imágenes.
      // En null, el frontend dibuja el avatar por defecto.
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    url_banner: {
      // Imagen de portada del perfil: beneficio Pro. Mismo criterio que
      // url_avatar, se guarda la URL y no el archivo.
      //
      // Si el usuario deja de ser Pro, el valor se conserva pero el frontend deja
      // de dibujarlo: si vuelve a pagar, su banner reaparece sin cargarlo de nuevo.
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    banner_position: {
      // Qué franja de la imagen se ve en el banner, en porcentaje vertical: 0 es
      // el borde de arriba, 100 el de abajo y 50 el centro. El banner es una
      // franja ancha y casi ninguna foto tiene esa proporción, así que sin esto
      // el recorte cae siempre en el medio y suele cortar lo importante.
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 50,
      validate: { min: 0, max: 100 },
    },
    profile_color: {
      // Color de acento del perfil: beneficio Pro, con la misma regla de
      // conservación que url_banner. NULL es el verde por defecto del sitio.
      type: DataTypes.ENUM(...PROFILE_COLORS),
      allowNull: true,
      defaultValue: null,
    },
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
