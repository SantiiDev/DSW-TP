// Entidad LIST_ALBUMS (tabla intermedia de la relación N:M entre listas y álbumes).
// LIST_ALBUMS (id_list, id_album, position, added_date)
//   id_list -> FK(LISTS) NN
//   id_album -> FK(ALBUMS) NN
//   id_list, id_album -> PK
//
// AGREGADO AL DER ORIGINAL, junto con LISTS. `position` da un orden estable
// dentro de la lista (el service lo asigna como el siguiente entero libre al
// agregar un álbum, nunca lo manda el cliente). No hay pantalla para reordenar a
// mano: sería drag & drop, que excede el nivel de la materia.
//
// Se mantiene la PK compuesta del pasaje a tablas, con el mismo criterio que
// genre-album.entity.ts y review-like.entity.ts: ninguna otra entidad referencia
// a esta tabla, así que la limitación de Sequelize con claves foráneas compuestas
// no aplica.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class ListAlbum extends Model<
  InferAttributes<ListAlbum>,
  InferCreationAttributes<ListAlbum>
> {
  declare id_list: number;
  declare id_album: number;
  declare position: number;
  declare added_date: CreationOptional<Date>;
}

ListAlbum.init(
  {
    id_list: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_album: {
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
    tableName: 'list_albums',
    indexes: [
      // El detalle de una lista ya sale por su PK (id_list es la primera
      // columna); este índice cubre el sentido inverso: en qué listas está un
      // álbum, que hace falta para saber si "Agregar a una lista" ya lo tildó.
      { name: 'ix_list_albums_album', fields: ['id_album'] },
    ],
  }
);
