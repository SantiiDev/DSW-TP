// Lógica de negocio del CRUD de usuarios: listar, ver perfil, actualizar y
// eliminar. No conoce req ni res; recibe datos ya validados y al actor
// autenticado (para chequear "dueño o admin"), y lanza errores de negocio que
// traduce el errorHandler.
import { User } from '../entities';
import { ConflictError, ForbiddenError, NotFoundError } from '../shared/errors/app-error';
import { TokenPayload } from '../shared/auth/jwt';
import { UserRole } from '../shared/types/enums';
import { userRepository } from './user.repository';
import { UpdateUserInput } from './user.schema';

/** Vista pública de un usuario: es lo único que sale en las respuestas de la API. */
type PublicUser = {
  id_user: number;
  username: string;
  email: string;
  rol: UserRole;
  registration_date: Date;
};

function toPublicUser(user: User): PublicUser {
  return {
    id_user: user.id_user,
    username: user.username,
    email: user.email,
    rol: user.rol,
    registration_date: user.registration_date,
  };
}

/**
 * Busca el usuario por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_user: number): Promise<User> {
  const user = await userRepository.findById(id_user);
  if (!user) throw new NotFoundError('El usuario');
  return user;
}

/**
 * Corta con 403 si el actor no es dueño del recurso ni ADMIN.
 * @param actor usuario autenticado que hace la request.
 * @param targetId id del usuario sobre el que se quiere actuar.
 */
function assertOwnerOrAdmin(actor: TokenPayload, targetId: number): void {
  if (actor.id_user !== targetId && actor.rol !== 'ADMIN') {
    throw new ForbiddenError('Solo podés modificar tu propia cuenta.');
  }
}

export const userService = {
  /** Lista todos los usuarios. La ruta ya restringe esto a ADMIN. */
  async list(): Promise<PublicUser[]> {
    const users = await userRepository.findAll();
    return users.map(toPublicUser);
  },

  /** Perfil público de un usuario puntual. */
  async getById(id_user: number): Promise<PublicUser> {
    const user = await findExisting(id_user);
    return toPublicUser(user);
  },

  /**
   * Actualiza username y/o email de un usuario.
   * @param id_user usuario a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(id_user: number, actor: TokenPayload, data: UpdateUserInput): Promise<PublicUser> {
    assertOwnerOrAdmin(actor, id_user);
    const user = await findExisting(id_user);

    // Mismo chequeo que en el registro: se valida antes de escribir para poder
    // decir qué campo específico está repetido. El índice único de la tabla es
    // la garantía real ante una carrera entre dos requests simultáneas.
    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id_user !== id_user) {
        throw new ConflictError('Ese nombre de usuario ya está en uso.');
      }
    }

    if (data.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing && existing.id_user !== id_user) {
        throw new ConflictError('Ya existe una cuenta registrada con ese email.');
      }
    }

    const updated = await userRepository.update(user, data);
    return toPublicUser(updated);
  },

  /**
   * Elimina la cuenta de un usuario.
   * @param id_user usuario a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_user: number, actor: TokenPayload): Promise<void> {
    assertOwnerOrAdmin(actor, id_user);
    const user = await findExisting(id_user);
    await userRepository.delete(user);
  },
};
