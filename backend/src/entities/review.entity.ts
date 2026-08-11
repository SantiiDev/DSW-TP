// Entidad REVIEW.
//
// Pasaje a tablas original:
//   REVIEW (id_review, rating, text_review, review_date, state,
//           id_user, id_album, number_track)
//     id_user -> FK(USERS) NN
//     id_album -> FK(ALBUMS) NULL
//     number_track -> FK(SONG) NULL
//     id_review -> PK
//
// DESVÍO: la FK a SONG pasa a llamarse `id_song`, porque la PK de SONG es ahora
// la clave subrogada id_song (ver song.entity.ts).
//
// Regla de negocio: una reseña es de un álbum O de una canción, nunca de las dos
// ni de ninguna. Se valida a nivel de modelo para que la base no pueda quedar
// inconsistente aunque el error venga de un service mal escrito.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { REVIEW_STATES, ReviewState } from '../shared/types/enums';

export class Review extends Model<InferAttributes<Review>, InferCreationAttributes<Review>> {
  declare id_review: CreationOptional<number>;
  declare rating: number;
  declare text_review: CreationOptional<string | null>;
  declare review_date: CreationOptional<Date>;
  declare state: CreationOptional<ReviewState>;
  declare id_user: number;
  declare id_album: CreationOptional<number | null>;
  declare id_song: CreationOptional<number | null>;
}

Review.init(
  {
    id_review: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    rating: {
      // DECIMAL(2,1) para admitir medias estrellas (0.5, 1.0, 1.5 ... 5.0),
      // que es la escala de calificación de Musicboxd.
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: { args: [0.5], msg: 'La calificación mínima es 0.5 estrellas.' },
        max: { args: [5], msg: 'La calificación máxima es 5 estrellas.' },
      },
      get(): number {
        const raw = this.getDataValue('rating');
        return raw === null ? 0 : Number(raw);
      },
    },
    text_review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    review_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    state: {
      type: DataTypes.ENUM(...REVIEW_STATES),
      allowNull: false,
      defaultValue: 'published',
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_album: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    id_song: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'review',
    validate: {
      // Valida la exclusividad entre álbum y canción a nivel de fila completa.
      targetIsAlbumOrSong(this: Review) {
        const hasAlbum = this.id_album !== null && this.id_album !== undefined;
        const hasSong = this.id_song !== null && this.id_song !== undefined;
        if (hasAlbum === hasSong) {
          throw new Error('Una reseña debe apuntar a un álbum o a una canción, pero no a ambos.');
        }
      },
    },
    indexes: [
      // Un usuario reseña una sola vez cada álbum y cada canción. Puede editar o
      // borrar esa reseña, pero no publicar una segunda sobre el mismo ítem.
      //
      // MySQL permite repetir filas con NULL dentro de un índice UNIQUE, así que
      // las reseñas de canciones (que tienen id_album NULL) no chocan entre sí en
      // uq_review_user_album, ni las de álbumes en uq_review_user_song.
      //
      // Estos índices además cubren el listado de reseñas del perfil de usuario,
      // porque id_user es la primera columna.
      { name: 'uq_review_user_album', unique: true, fields: ['id_user', 'id_album'] },
      { name: 'uq_review_user_song', unique: true, fields: ['id_user', 'id_song'] },
      // El detalle de álbum y de canción trae sus reseñas paginadas.
      { name: 'ix_review_album', fields: ['id_album'] },
      { name: 'ix_review_song', fields: ['id_song'] },
    ],
  }
);
