// Entidad SUBSCRIPTION (suscripción de un usuario a un plan, con su vigencia).
//
// Pasaje a tablas original:
//   SUBSCRIPTION (id_user, id_plan, subscription_date)
//     id_user -> FK(USERS) NN
//     id_plan -> FK(PLAN) NN
//     subscription_date, id_user, id_plan -> PK
//
// DESVÍO 1: se agrega la clave subrogada `id_subscription` como PK, y la clave natural
// (id_user, id_plan, subscription_date) se mantiene garantizada por un índice UNIQUE.
// Motivo: Sequelize v6 no soporta claves foráneas compuestas en sus asociaciones
// (issue #311), y PAYMENTS necesita apuntar a SUBSCRIPTION. Con la clave subrogada
// la regla de unicidad del modelo se conserva intacta y la asociación es de una columna.
//
// DESVÍO 2: se agregan `end_date` y `state`. El DER original solo registraba la fecha
// de alta, con lo cual no había forma de saber si una membresía sigue vigente ni de
// distinguir una baja de un vencimiento. Sin esto el CUU de membresías queda incompleto:
// un usuario que pagó una vez sería PRO para siempre.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { SUBSCRIPTION_STATES, SubscriptionState } from '../shared/types/enums';

export class Subscription extends Model<
  InferAttributes<Subscription>,
  InferCreationAttributes<Subscription>
> {
  declare id_subscription: CreationOptional<number>;
  declare id_user: number;
  declare id_plan: number;
  declare subscription_date: CreationOptional<Date>;
  declare end_date: CreationOptional<Date | null>;
  declare state: CreationOptional<SubscriptionState>;
}

Subscription.init(
  {
    id_subscription: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_plan: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    subscription_date: {
      // Fecha de alta de la membresía.
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    end_date: {
      // Fecha de vencimiento. NULL en el plan Free, que no vence.
      type: DataTypes.DATE,
      allowNull: true,
    },
    state: {
      type: DataTypes.ENUM(...SUBSCRIPTION_STATES),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'subscription',
    validate: {
      // El vencimiento nunca puede ser anterior al alta.
      endDateAfterStart(this: Subscription) {
        if (this.end_date && this.subscription_date && this.end_date <= this.subscription_date) {
          throw new Error('La fecha de vencimiento debe ser posterior a la fecha de alta.');
        }
      },
    },
    indexes: [
      {
        // Clave natural del pasaje a tablas: un usuario no puede suscribirse
        // dos veces al mismo plan en el mismo instante.
        name: 'uq_subscription_natural_key',
        unique: true,
        fields: ['id_user', 'id_plan', 'subscription_date'],
      },
      {
        // Consulta más frecuente del sistema: "¿cuál es la membresía vigente
        // de este usuario?". Se resuelve con este índice.
        //
        // Nota: que haya UNA SOLA suscripción 'active' por usuario no se puede
        // garantizar con un índice UNIQUE (MySQL no soporta índices únicos
        // parciales/filtrados). Esa regla la aplica el service de membresías:
        // al activar una nueva suscripción, pasa la anterior a 'cancelled'
        // dentro de la misma transacción.
        name: 'ix_subscription_user_state',
        fields: ['id_user', 'state'],
      },
    ],
  }
);
