// Acceso a datos de la feature user: consultas a la tabla users para el CRUD de
// perfiles (no confundir con auth.repository, que es específico del circuito de
// registro/login). Es la única capa que habla con Sequelize.
import { Transaction } from 'sequelize';
import { User } from '../../entities';
import { UserRole, UserState } from '../../shared/types/enums';

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
  state?: UserState;
  url_avatar?: string | null;
};

export const userRepository = {
  findAll: () => User.findAll(),

  create: (data: CreateUserData) => User.create(data),

  findById: (id_user: number) => User.findByPk(id_user),

  findByEmail: (email: string) => User.findOne({ where: { email } }),

  findByUsername: (username: string) => User.findOne({ where: { username } }),

  /**
   * Cuántas cuentas activas hay de cada rol. Las suspendidas no cuentan: es la
   * foto de los usuarios que hoy usan el sitio, para el dashboard de admin.
   *
   * @returns una fila por rol que tenga al menos una cuenta.
   */
  countActiveByRole: async (): Promise<{ rol: UserRole; count: number }[]> => {
    // Con `group`, count() devuelve un arreglo de { rol, count } en vez de un número.
    const rows = (await User.count({
      where: { state: 'active' },
      group: ['rol'],
    })) as unknown as { rol: UserRole; count: number }[];

    return rows.map((row) => ({ rol: row.rol, count: Number(row.count) }));
  },

  update: async (user: User, data: UpdateUserData, transaction?: Transaction): Promise<User> =>
    user.update(data, { transaction }),

  /**
   * Cambia el estado de la cuenta: es la baja (y el alta) lógica.
   *
   * No existe un delete acá a propósito. Borrar la fila se llevaría puestas las
   * reseñas y los pagos del usuario, que la referencian por FK.
   */
  updateState: async (user: User, state: UserState): Promise<User> => user.update({ state }),
};
