// Entidad USERS.
// USERS (id_user, username, email, password, rol, registration_date)
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
      unique: true,
      validate: { len: { args: [3, 50], msg: 'El nombre de usuario debe tener entre 3 y 50 caracteres.' } },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
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
    registration_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
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
