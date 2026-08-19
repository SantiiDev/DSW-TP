import { QueryTypes } from 'sequelize';
import { sequelize } from './src/shared/db/sequelize';

void (async () => {
  await sequelize.authenticate();
  const roles = await sequelize.query(`SELECT CAST(rol AS CHAR) AS rol, COUNT(*) AS total FROM users GROUP BY rol`, { type: QueryTypes.SELECT });
  const plans = await sequelize.query(`SELECT id_plan, name FROM plan`, { type: QueryTypes.SELECT });
  const col = await sequelize.query(`SHOW COLUMNS FROM users LIKE 'rol'`, { type: QueryTypes.SELECT });
  const subs = await sequelize.query(`SELECT COUNT(*) AS total FROM subscription`, { type: QueryTypes.SELECT });
  console.log('ROLES:', JSON.stringify(roles));
  console.log('PLANS:', JSON.stringify(plans));
  console.log('COL  :', JSON.stringify(col));
  console.log('SUBS :', JSON.stringify(subs));
  await sequelize.close();
})();
