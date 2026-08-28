// Entidad REVIEW_COMMENTS.
// REVIEW_COMMENTS (id_comment, text_comment, comment_date, id_review, id_user)
//   id_review -> FK(REVIEW) NN
//   id_user -> FK(USERS) NN
//   id_comment -> PK
//
// AGREGADO AL DER ORIGINAL. A diferencia del "me gusta", un comentario SÍ es una
// entidad: tiene datos propios (su texto, su fecha y su autor), así que no puede
// ser una relación entre dos tablas.
//
// Es una entidad DÉBIL respecto de REVIEW: no existe por fuera de la reseña que
// comenta, y si esa reseña se borra sus comentarios se van con ella (la asociación
// va con CASCADE en entities/index.ts).
//
// Se le pone una PK subrogada `id_comment` en vez de una clave compuesta, con el
// mismo criterio que se usó en song.entity.ts: un mismo usuario puede comentar
// varias veces la misma reseña, así que (id_review, id_user) no identifica una
// fila.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class ReviewComment extends Model<
  InferAttributes<ReviewComment>,
  InferCreationAttributes<ReviewComment>
> {
  declare id_comment: CreationOptional<number>;
  declare text_comment: string;
  declare comment_date: CreationOptional<Date>;
  declare id_review: number;
  declare id_user: number;
}

ReviewComment.init(
  {
    id_comment: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    text_comment: {
      // A diferencia del texto de una reseña, acá es obligatorio: un comentario
      // vacío no es nada. La reseña sí puede ser una calificación sola.
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: 'El comentario no puede estar vacío.' } },
    },
    comment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_review: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'review_comments',
    indexes: [
      // Los comentarios se piden siempre por reseña, para dibujarlos debajo de
      // ella y para contarlos.
      { name: 'ix_review_comments_review', fields: ['id_review'] },
    ],
  }
);
