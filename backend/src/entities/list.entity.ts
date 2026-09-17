// Entidad LISTS.
// LISTS (id_list, name, description, creation_date, id_user)
//   id_user -> FK(USERS) NN
//   id_list -> PK
//
// AGREGADO AL DER ORIGINAL. Es lo que sostiene el alcance adicional voluntario de
// la propuesta ("Listas personalizadas: creación y gestión de agrupaciones de
// álbumes públicas"). Una lista es siempre pública, tal como quedó definido en la
// propuesta: no lleva ninguna columna de visibilidad.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class List extends Model<InferAttributes<List>, InferCreationAttributes<List>> {
  declare id_list: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare creation_date: CreationOptional<Date>;
  declare id_user: number;
}

List.init(
  {
    id_list: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre de la lista no puede estar vacío.' } },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    creation_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'lists',
    indexes: [
      // El explorador de listas y "Mis listas" del perfil filtran por autor.
      { name: 'ix_lists_user', fields: ['id_user'] },
    ],
  }
);
