// Acceso a datos de la feature user: consultas a la tabla users para el CRUD de
// perfiles (no confundir con auth.repository, que es específico del circuito de
// registro/login). Es la única capa que habla con Sequelize.
import { User } from '../entities';
import { UserRole } from '../shared/types/enums';

type CreateUserData = {
  username: string;
  email: string;
  /** Ya hasheado con bcrypt: acá nunca llega una contraseña en texto plano. */
  password: string;
  rol: UserRole;
  url_avatar?: string | null;
};

type UpdateUserData = {
  username?: string;
  email?: string;
  rol?: UserRole;
  url_avatar?: string | null;
};

export const userRepository = {
  findAll: () => User.findAll(),

  create: (data: CreateUserData) => User.create(data),

  findById: (id_user: number) => User.findByPk(id_user),

  findByEmail: (email: string) => User.findOne({ where: { email } }),

  findByUsername: (username: string) => User.findOne({ where: { username } }),

  update: async (user: User, data: UpdateUserData): Promise<User> => user.update(data),

  /**
   * Da de alta o de baja una cuenta (baja lógica).
   * No hay un delete: las cuentas nunca se borran de la tabla, se marcan
   * inactivas para no perder las reseñas, pagos y suscripciones que las
   * referencian por FK.
   */
  setActive: async (user: User, is_active: boolean): Promise<User> =>
    user.update({ is_active }),
};
