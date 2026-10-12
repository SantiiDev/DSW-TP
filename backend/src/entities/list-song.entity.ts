// Entidad LIST_SONGS (tabla intermedia de la relación N:M entre listas y canciones).
// LIST_SONGS (id_list, id_song, position, added_date)
//   id_list -> FK(LISTS) NN
//   id_song -> FK(SONG) NN
//   id_list, id_song -> PK
//
// AGREGADO AL DER ORIGINAL, junto con LISTS y LIST_ALBUMS. Es el espejo exacto de
// list-album.entity.ts: mismas columnas y mismo criterio, cambiando el álbum por
// la canción.
//
// Son DOS tablas y no una sola con id_album e id_song excluyentes (como sí hace
// REVIEW) por dos motivos:
//   1. Una PK compuesta no admite columnas NULL, así que una tabla única
//      necesitaría una clave subrogada y dos índices UNIQUE, desviándose del
//      pasaje a tablas de las demás intermedias del modelo.
//   2. Con dos tablas, que una lista no pueda mezclar álbumes y canciones queda
//      garantizado por la estructura (LISTS.type decide en cuál se escribe) y no
//      por una validación que un service podría saltearse.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class ListSong extends Model<
  InferAttributes<ListSong>,
  InferCreationAttributes<ListSong>
> {
  declare id_list: number;
  declare id_song: number;
  declare position: number;
  declare added_date: CreationOptional<Date>;
}

ListSong.init(
  {
    id_list: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_song: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    added_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'list_songs',
    indexes: [
      // El detalle de una lista ya sale por su PK (id_list es la primera
      // columna); este índice cubre el sentido inverso: en qué listas está una
      // canción, que hace falta para saber si "Agregar a una lista" ya la tildó.
      { name: 'ix_list_songs_song', fields: ['id_song'] },
    ],
  }
);
