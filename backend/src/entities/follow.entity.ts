// Entidad FOLLOWS (tabla intermedia de la relación N:M de USERS consigo misma).
// FOLLOWS (id_follower, id_followed, follow_date)
//   id_follower -> FK(USERS) NN   quién sigue
//   id_followed -> FK(USERS) NN   a quién sigue
//   id_follower, id_followed -> PK
//
// AGREGADO AL DER ORIGINAL. Es lo que hace posible el feed social: sin saber
// quién sigue a quién no hay forma de armar "las reseñas de la gente que sigo".
// No se puede modelar como un atributo de USERS, porque un usuario sigue a
// muchos y es seguido por muchos: es una N:M, y en el pasaje a tablas una N:M se
// materializa como tabla intermedia, la misma figura que GENRES_ALBUMS y
// REVIEW_LIKES.
//
// La particularidad es que esta N:M es RECURSIVA: las dos claves foráneas
// apuntan a la misma tabla. Por eso cada una lleva el nombre de su rol en la
// relación (el que sigue y el seguido) y no el nombre de la tabla.
//
// El seguimiento es UNIDIRECCIONAL, como en Letterboxd: seguir a alguien no
// necesita que la otra parte acepte. Por eso la relación no lleva ningún
// atributo de estado: la fila existe o no existe.
//
// Igual que en review-like.entity.ts se mantiene la PK compuesta del pasaje a
// tablas: ninguna otra entidad referencia a esta, así que la limitación de
// Sequelize con claves foráneas compuestas no aplica. Esa PK es además lo que
// garantiza que no se pueda seguir dos veces a la misma persona.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class Follow extends Model<InferAttributes<Follow>, InferCreationAttributes<Follow>> {
  declare id_follower: number;
  declare id_followed: number;
  declare follow_date: CreationOptional<Date>;
}

Follow.init(
  {
    id_follower: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    id_followed: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    follow_date: {
      // Único atributo propio de la relación. No lo muestra ninguna pantalla hoy,
      // pero es lo que permitiría después listar "nuevos seguidores de esta
      // semana" sin tener que agregar la columna con datos ya cargados.
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'follows',
    indexes: [
      // Las dos consultas de esta tabla son los dos sentidos de la relación. La
      // PK compuesta ya cubre "a quién sigue X", porque id_follower es su primera
      // columna: es la del feed de amigos y la del contador "Siguiendo". Este
      // índice cubre el sentido inverso, "quiénes siguen a X", que es el contador
      // "Seguidores" del perfil.
      //
      // Nunca `unique: true` en la definición de una columna: sync({ alter: true })
      // crearía un índice nuevo sin nombre en cada arranque hasta que MySQL corte
      // con ER_TOO_MANY_KEYS. Por el mismo motivo esta tabla no hace falta
      // agregarla al mapa de scripts/fix-indexes.ts: ese script desduplica índices
      // únicos de una sola columna, y acá no hay ninguno.
      { name: 'ix_follows_followed', fields: ['id_followed'] },
    ],
  }
);
