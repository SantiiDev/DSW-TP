// Acceso a datos de la feature user: consultas a la tabla users para el CRUD de
// perfiles (no confundir con auth.repository, que es específico del circuito de
// registro/login). Es la única capa que habla con Sequelize.
import { User } from '../entities';

type UpdateUserData = {
  username?: string;
  email?: string;
};

export const userRepository = {
  findAll: () => User.findAll(),

  findById: (id_user: number) => User.findByPk(id_user),

  findByEmail: (email: string) => User.findOne({ where: { email } }),

  findByUsername: (username: string) => User.findOne({ where: { username } }),

  update: async (user: User, data: UpdateUserData): Promise<User> => user.update(data),

  delete: (user: User): Promise<void> => user.destroy(),
};
