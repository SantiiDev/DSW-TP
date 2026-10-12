// Entidad LISTS.
// LISTS (id_list, name, description, type, creation_date, id_user)
//   id_user -> FK(USERS) NN
//   id_list -> PK
//
// AGREGADO AL DER ORIGINAL. Es lo que sostiene el alcance adicional voluntario de
// la propuesta ("Listas personalizadas: creación y gestión de agrupaciones de
// álbumes públicas"). Una lista es siempre pública, tal como quedó definido en la
// propuesta: no lleva ninguna columna de visibilidad.
//
// `type` dice si la lista es de álbumes o de canciones. Una lista es de un tipo
// o del otro, nunca de los dos: esa regla no la aplica ningún service, la aplica
// la estructura, porque los ítems de cada tipo viven en su propia tabla
// intermedia (LIST_ALBUMS y LIST_SONGS).
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { LIST_TYPES, ListType } from '../shared/types/enums';

export class List extends Model<InferAttributes<List>, InferCreationAttributes<List>> {
  declare id_list: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare type: CreationOptional<ListType>;
  declare creation_date: CreationOptional<Date>;
  declare id_user: number;
}

List.init(
  {
    id_list: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre de la lista no puede estar vacío.' } },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    type: {
      // El default no es cosmético: es lo que deja como listas de álbumes a las
      // que ya estaban cargadas cuando se sumaron las de canciones, sin tener
      // que migrar nada a mano.
      type: DataTypes.ENUM(...LIST_TYPES),
      allowNull: false,
      defaultValue: 'album',
    },
    creation_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'lists',
    indexes: [
      // El explorador de listas y "Mis listas" del perfil filtran por autor.
      { name: 'ix_lists_user', fields: ['id_user'] },
    ],
  }
);
