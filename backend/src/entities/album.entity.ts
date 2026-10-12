// Entidad ALBUMS.
// ALBUMS (id_album, title, release_year, url_cover, average_rating, state,
//         created_by, id_artist)
//   id_artist -> FK(ARTIST) NN
//   id_album -> PK
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { CONTENT_STATES, ContentState } from '../shared/types/enums';

export class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>> {
  declare id_album: CreationOptional<number>;
  declare title: string;
  declare release_year: CreationOptional<number | null>;
  declare url_cover: CreationOptional<string | null>;
  declare average_rating: CreationOptional<number>;
  declare state: CreationOptional<ContentState>;
  declare created_by: CreationOptional<number | null>;
  declare id_artist: number;
}

Album.init(
  {
    id_album: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: { msg: 'El título del álbum no puede estar vacío.' } },
    },
    release_year: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
      validate: {
        min: { args: [1900], msg: 'El año de lanzamiento debe ser posterior a 1900.' },
        max: { args: [2100], msg: 'El año de lanzamiento no es válido.' },
      },
    },
    url_cover: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    average_rating: {
      // Atributo derivado: se recalcula cada vez que se crea, edita o borra una
      // reseña del álbum. Se guarda denormalizado para no recalcularlo en cada listado.
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      get(): number {
        const raw = this.getDataValue('average_rating');
        return raw === null ? 0 : Number(raw);
      },
    },
    state: {
      type: DataTypes.ENUM(...CONTENT_STATES),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    id_artist: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'albums',
    indexes: [
      { name: 'ix_albums_title', fields: ['title'] },
      // El listado principal filtra por año y ordena por rating.
      { name: 'ix_albums_release_year', fields: ['release_year'] },
    ],
  }
);
