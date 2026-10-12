// Entidad REVIEW_LIKES (tabla intermedia de la relación N:M entre usuarios y reseñas).
// REVIEW_LIKES (id_user, id_review, liked_date)
//   id_user -> FK(USERS) NN
//   id_review -> FK(REVIEW) NN
//   id_user, id_review -> PK
//
// AGREGADO AL DER ORIGINAL. El "me gusta" no puede ser un atributo de REVIEW: un
// contador no sabe QUIÉN lo puso, y sin eso no se puede impedir que la misma
// persona lo dé dos veces, ni pintar el corazón lleno, ni sacarlo. Es una relación
// N:M entre USERS y REVIEW, y en el pasaje a tablas una N:M se materializa como
// tabla intermedia: la misma figura que GENRES_ALBUMS.
//
// Igual que en genre-album.entity.ts se mantiene la PK compuesta del pasaje a
// tablas: ninguna otra entidad referencia a esta, así que la limitación de
// Sequelize con claves foráneas compuestas no aplica. Esa PK es además lo que
// garantiza que no haya dos "me gusta" del mismo usuario sobre la misma reseña.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class ReviewLike extends Model<
  InferAttributes<ReviewLike>,
  InferCreationAttributes<ReviewLike>
> {
  declare id_user: number;
  declare id_review: number;
  declare liked_date: CreationOptional<Date>;
}

ReviewLike.init(
  {
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_review: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    liked_date: {
      // Único atributo propio de la relación. No lo muestra ninguna pantalla hoy,
      // pero es lo que permitiría ordenar "las reseñas que más gustaron esta
      // semana" sin tener que agregar la columna después con datos ya cargados.
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'review_likes',
    indexes: [
      // El conteo de "me gusta" de una reseña y el listado de las que le gustaron
      // a un usuario son las dos consultas de esta tabla. La PK compuesta ya cubre
      // la segunda (id_user es su primera columna); esta cubre la primera.
      { name: 'ix_review_likes_review', fields: ['id_review'] },
    ],
  }
);
