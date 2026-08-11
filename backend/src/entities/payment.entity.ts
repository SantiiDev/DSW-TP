// Entidad PAYMENTS (pagos registrados de una suscripción).
//
// Pasaje a tablas original:
//   PAYMENTS (id_transaction, amount, payment_date, state, id_gateway,
//             id_user, id_plan, subscription_date)
//     id_user, id_plan, subscription_date -> FK(SUBSCRIPTION) NN
//     id_transaction -> PK
//
// DESVÍO: la FK compuesta a SUBSCRIPTION se reemplaza por la columna única
// `id_subscription` (ver comentario en subscription.entity.ts). Es la misma relación,
// expresada con una sola columna para que Sequelize pueda asociarla.
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';
import { PAYMENT_STATES, PaymentState } from '../shared/types/enums';

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id_transaction: CreationOptional<number>;
  declare amount: number;
  declare payment_date: CreationOptional<Date>;
  declare state: CreationOptional<PaymentState>;
  declare id_gateway: CreationOptional<string | null>;
  declare id_subscription: number;
}

Payment.init(
  {
    id_transaction: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'El monto no puede ser negativo.' } },
      get(): number {
        const raw = this.getDataValue('amount');
        return raw === null ? 0 : Number(raw);
      },
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    state: {
      type: DataTypes.ENUM(...PAYMENT_STATES),
      allowNull: false,
      defaultValue: 'pending',
    },
    id_gateway: {
      // Identificador que devuelve la pasarela de pago (MercadoPago).
      // Es NULL hasta que la pasarela confirma la operación por webhook.
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    id_subscription: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'payments',
  }
);
