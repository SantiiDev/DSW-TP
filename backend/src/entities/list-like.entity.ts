// Entidad LIST_LIKES (tabla intermedia de la relación N:M entre usuarios y listas).
// LIST_LIKES (id_list, id_user, liked_date)
//   id_list -> FK(LISTS) NN
//   id_user -> FK(USERS) NN
//   id_list, id_user -> PK
//
// AGREGADO AL DER ORIGINAL, con el mismo argumento que REVIEW_LIKES: el "me
// gusta" no puede ser un contador dentro de LISTS porque un contador no sabe
// QUIÉN lo puso, y sin eso no se puede impedir que la misma persona lo dé dos
// veces, ni pintar el corazón lleno, ni sacarlo. Es una N:M entre USERS y LISTS,
// y en el pasaje a tablas se materializa como tabla intermedia: la misma figura
// que GENRES_ALBUMS y REVIEW_LIKES.
//
// Se mantiene la PK compuesta del pasaje a tablas, con el mismo criterio que
// review-like.entity.ts: ninguna otra entidad referencia a esta tabla.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class ListLike extends Model<InferAttributes<ListLike>, InferCreationAttributes<ListLike>> {
  declare id_list: number;
  declare id_user: number;
  declare liked_date: CreationOptional<Date>;
}

ListLike.init(
  {
    id_list: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    liked_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'list_likes',
    indexes: [
      // El conteo de "me gusta" de una lista y el ranking "Top Listas" son las
      // consultas más frecuentes de esta tabla. La PK compuesta ya cubre "por
      // id_user" (es su primera columna); este índice cubre "por id_list".
      { name: 'ix_list_likes_list', fields: ['id_list'] },
    ],
  }
);
