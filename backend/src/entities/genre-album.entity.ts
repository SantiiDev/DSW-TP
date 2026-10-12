// Entidad GENRES_ALBUMS (tabla intermedia de la relación N:M entre géneros y álbumes).
// GENRES_ALBUMS (id_genre, id_album)
//   id_genre -> FK(GENRES) NN
//   id_album -> FK(ALBUMS) NN
//   id_genre, id_album -> PK
//
// Acá sí se mantiene la clave primaria compuesta del pasaje a tablas: ninguna otra
// entidad referencia a esta tabla, así que la limitación de Sequelize con claves
// foráneas compuestas no aplica.
import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class GenreAlbum extends Model<
  InferAttributes<GenreAlbum>,
  InferCreationAttributes<GenreAlbum>
> {
  declare id_genre: number;
  declare id_album: number;
}

GenreAlbum.init(
  {
    id_genre: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_album: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'genres_albums',
  }
);
