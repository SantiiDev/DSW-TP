// Entidad GENRES.
// GENRES (id_genre, name)
//   id_genre -> PK
//
// Nota: el pasaje a tablas entregado dice "id_album -> PK" en GENRES; se interpreta
// como un error de tipeo, ya que la PK de GENRES es id_genre según el DER.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class Genre extends Model<InferAttributes<Genre>, InferCreationAttributes<Genre>> {
  declare id_genre: CreationOptional<number>;
  declare name: string;
}

Genre.init(
  {
    id_genre: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: { notEmpty: { msg: 'El nombre del género no puede estar vacío.' } },
    },
  },
  {
    sequelize,
    tableName: 'genres',
  }
);
