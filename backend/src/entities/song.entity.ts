// Entidad SONG.
//
// Pasaje a tablas original:
//   SONG (number_track, song_title, duration, state, created_by, id_album)
//     id_album -> FK(ALBUMS) NULL
//
// DESVÍO RESPECTO DEL PASAJE A TABLAS:
// Se agrega la clave subrogada `id_song` como PK. Motivo: `number_track` es el número
// de pista dentro del álbum (1, 2, 3...), por lo que se repite entre álbumes distintos
// y no puede identificar por sí solo a una canción. Como además `id_album` admite NULL
// (una canción puede no pertenecer a ningún álbum), tampoco se puede usar la clave
// compuesta (id_album, number_track) como PK.
//
// La regla de unicidad real del modelo —no puede haber dos pistas con el mismo número
// dentro del mismo álbum— se conserva mediante un índice UNIQUE.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { CONTENT_STATES, ContentState } from '../shared/types/enums';

export class Song extends Model<InferAttributes<Song>, InferCreationAttributes<Song>> {
  declare id_song: CreationOptional<number>;
  declare number_track: number;
  declare song_title: string;
  declare duration: CreationOptional<number | null>;
  declare state: CreationOptional<ContentState>;
  declare created_by: CreationOptional<number | null>;
  declare id_album: CreationOptional<number | null>;
}

Song.init(
  {
    id_song: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    number_track: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      validate: { min: { args: [1], msg: 'El número de pista debe ser mayor a cero.' } },
    },
    song_title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: { msg: 'El título de la canción no puede estar vacío.' } },
    },
    duration: {
      // Duración en segundos: es lo que devuelven las APIs de metadata y es más
      // simple de operar que un TIME.
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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
    id_album: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'song',
    indexes: [
      {
        // Clave natural: dentro de un álbum, el número de pista es único.
        // MySQL permite repetir filas con id_album NULL, que es justo lo que queremos
        // para las canciones sueltas (sin álbum).
        name: 'uq_song_album_track',
        unique: true,
        fields: ['id_album', 'number_track'],
      },
    ],
  }
);
