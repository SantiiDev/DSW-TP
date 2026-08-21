// Entidad ARTIST.
// ARTIST (id_artist, name, biography, state, created_by)
//   id_artist -> PK
//
// `state` y `created_by` sostienen el CUU de aporte de catálogo: lo que carga el seed
// entra como 'approved', y lo que da de alta un usuario PATRON entra como 'pending'
// hasta que un ADMIN lo aprueba.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { CONTENT_STATES, ContentState } from '../shared/types/enums';

export class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>> {
  declare id_artist: CreationOptional<number>;
  declare name: string;
  declare biography: CreationOptional<string | null>;
  declare state: CreationOptional<ContentState>;
  declare created_by: CreationOptional<number | null>;
}

Artist.init(
  {
    id_artist: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre del artista no puede estar vacío.' } },
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    state: {
      type: DataTypes.ENUM(...CONTENT_STATES),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_by: {
      // NULL para los artistas que vienen del seed inicial (no los cargó ningún usuario).
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'artist',
    indexes: [{ name: 'ix_artist_name', fields: ['name'] }],
  }
);
