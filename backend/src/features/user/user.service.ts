// Lógica de negocio del CRUD de usuarios: crear, listar, ver perfil, actualizar
// y dar de baja. No conoce req ni res; recibe datos ya validados y al actor
// autenticado (para chequear "dueño o admin"), y lanza errores de negocio que
// traduce el errorHandler.
//
// La baja es LÓGICA: ver userService.suspend() al final del archivo.
import bcrypt from 'bcryptjs';
import { User } from '../../entities';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
import { UserRole, UserState } from '../../shared/types/enums';
import { userRepository } from './user.repository';
import { CreateUserInput, UpdateUserInput } from './user.schema';

// Mismo costo que usan el registro público y el seed del admin.
const SALT_ROUNDS = 10;

/**
 * Vista pública de un usuario: es lo único que sale en las respuestas de la API.
 *
 * El email es opcional porque no se muestra en el perfil de otro usuario: es un
 * dato de contacto, no parte del perfil público. Solo viaja cuando el que pide
 * es el dueño de la cuenta o un ADMIN.
 */
type PublicUser = {
  id_user: number;
  username: string;
  email?: string;
  rol: UserRole;
  /** 'active' o 'suspended': una cuenta suspendida no puede iniciar sesión. */
  state: UserState;
  url_avatar: string | null;
  registration_date: Date;
};

/**
 * Arma la vista pública de un usuario.
 * @param user usuario de la base.
 * @param includeEmail si se incluye el email (solo para el dueño o un ADMIN).
 */
function toPublicUser(user: User, includeEmail = true): PublicUser {
  return {
    id_user: user.id_user,
    username: user.username,
    ...(includeEmail ? { email: user.email } : {}),
    rol: user.rol,
    state: user.state,
    url_avatar: user.url_avatar ?? null,
    registration_date: user.registration_date,
  };
}

/** ¿El actor es el dueño de esa cuenta, o un ADMIN? */
function canSeePrivateData(actor: TokenPayload, targetId: number): boolean {
  return actor.id_user === targetId || actor.rol === 'ADMIN';
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

/**
 * Corta con 409 si el username o el email ya los tiene otro usuario.
 *
 * Se chequea antes de escribir para poder decir qué campo está repetido; la
 * garantía real la dan los índices únicos de la tabla, que rechazan el segundo
 * registro si dos requests entran al mismo tiempo.
 *
 * @param data username y/o email a verificar.
 * @param excludeId en una edición, el id del propio usuario: que su email
 *   coincida consigo mismo no es un conflicto.
 */
async function assertAvailable(
  data: { username?: string; email?: string },
  excludeId?: number
): Promise<void> {
  if (data.username) {
    const existing = await userRepository.findByUsername(data.username);
    if (existing && existing.id_user !== excludeId) {
      throw new ConflictError('Ese nombre de usuario ya está en uso.');
    }
  }

  if (data.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing && existing.id_user !== excludeId) {
      throw new ConflictError('Ya existe una cuenta registrada con ese email.');
    }
  }
}

export const userService = {
  /**
   * Da de alta un usuario desde el panel de administración.
   *
   * Es distinto del registro público (auth.register): acá se puede elegir el rol,
   * y no se emite ningún token porque el admin no queda logueado como el usuario
   * que acaba de crear. La ruta ya restringe esto a ADMIN.
   *
   * @param data username, email, contraseña en texto plano y rol opcional.
   */
  async create(data: CreateUserInput): Promise<PublicUser> {
    await assertAvailable({ username: data.username, email: data.email });

    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, SALT_ROUNDS),
      rol: data.rol ?? 'FREE',
      url_avatar: data.url_avatar ?? null,
    });

    return toPublicUser(user);
  },

  /**
   * Lista todos los usuarios, con email incluido: la ruta ya restringe esto a
   * ADMIN, que es quien administra las cuentas y necesita verlo.
   */
  async list(): Promise<PublicUser[]> {
    const users = await userRepository.findAll();
    // La lambda es necesaria: pasar toPublicUser directo le mandaría el índice
    // del map como segundo parámetro.
    return users.map((user) => toPublicUser(user));
  },

  /**
   * Perfil de un usuario puntual.
   * @param id_user usuario a mostrar.
   * @param actor usuario autenticado que hace la request; define si ve el email.
   */
  async getById(id_user: number, actor: TokenPayload): Promise<PublicUser> {
    const user = await findExisting(id_user);
    return toPublicUser(user, canSeePrivateData(actor, id_user));
  },

  /**
   * Actualiza username, email y/o rol de un usuario.
   * @param id_user usuario a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(id_user: number, actor: TokenPayload, data: UpdateUserInput): Promise<PublicUser> {
    assertOwnerOrAdmin(actor, id_user);

    // El rol es lo único que un usuario NO puede cambiarse a sí mismo: si no,
    // cualquiera se haría ADMIN editando su propio perfil.
    if (data.rol !== undefined && actor.rol !== 'ADMIN') {
      throw new ForbiddenError('Solo un administrador puede cambiar el rol de una cuenta.');
    }

    // Lo mismo con el estado: si no, un usuario suspendido se reactivaría solo.
    if (data.state !== undefined && actor.rol !== 'ADMIN') {
      throw new ForbiddenError('Solo un administrador puede cambiar el estado de una cuenta.');
    }

    const user = await findExisting(id_user);
    await assertAvailable({ username: data.username, email: data.email }, id_user);

    const updated = await userRepository.update(user, data);
    return toPublicUser(updated);
  },

  /**
   * Da de baja la cuenta de un usuario: BAJA LÓGICA.
   *
   * No borra la fila, la deja en state = 'suspended'. Se hace así por dos motivos:
   * el usuario deja reseñas y pagos que lo referencian por FK (borrarlo obligaría
   * a borrar todo eso), y una suspensión se puede revertir, un DELETE no.
   *
   * A partir de acá la cuenta no puede iniciar sesión ni usar su token viejo, pero
   * sigue existiendo para el ADMIN, que puede reactivarla con activate().
   *
   * @param id_user usuario a suspender.
   * @param actor usuario autenticado que hace la request (el dueño o un ADMIN).
   * @returns el usuario ya suspendido, para que el panel actualice la fila.
   */
  async suspend(id_user: number, actor: TokenPayload): Promise<PublicUser> {
    assertOwnerOrAdmin(actor, id_user);
    const user = await findExisting(id_user);

    if (user.state === 'suspended') {
      throw new BadRequestError('La cuenta ya está suspendida.');
    }

    const suspended = await userRepository.updateState(user, 'suspended');
    return toPublicUser(suspended);
  },

  /**
   * Reactiva una cuenta suspendida. Solo ADMIN: la ruta ya lo restringe.
   * @param id_user usuario a reactivar.
   * @returns el usuario ya activo.
   */
  async activate(id_user: number): Promise<PublicUser> {
    const user = await findExisting(id_user);

    if (user.state === 'active') {
      throw new BadRequestError('La cuenta ya está activa.');
    }

    const activated = await userRepository.updateState(user, 'active');
    return toPublicUser(activated);
  },
};
