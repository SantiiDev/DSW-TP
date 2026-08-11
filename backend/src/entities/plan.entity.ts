// Entidad PLAN (planes de membresía: Free, Pro, Patron).
// PLAN (id_plan, name, amount, description)
//   id_plan -> PK
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../shared/db/sequelize';

export class Plan extends Model<InferAttributes<Plan>, InferCreationAttributes<Plan>> {
  declare id_plan: CreationOptional<number>;
  declare name: string;
  declare amount: number;
  declare description: CreationOptional<string | null>;
}

Plan.init(
  {
    id_plan: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    amount: {
      // DECIMAL y no FLOAT: es plata, no puede tener error de redondeo.
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'El monto no puede ser negativo.' } },
      // Sequelize devuelve DECIMAL como string; lo pasamos a number para la API.
      get(): number {
        const raw = this.getDataValue('amount');
        return raw === null ? 0 : Number(raw);
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'plan',
  }
);
