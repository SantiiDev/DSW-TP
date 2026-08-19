// Lógica de negocio de la autenticación: registro, inicio de sesión y datos del
// usuario logueado. No conoce req ni res; recibe datos ya validados y devuelve
// objetos planos, o lanza un error de negocio que traduce el errorHandler.
import bcrypt from 'bcryptjs';
import { User } from '../../entities';
import { signToken } from '../../shared/auth/jwt';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors/app-error';
import { UserRole } from '../../shared/types/enums';
import { authRepository } from './auth.repository';
import { LoginInput, RegisterInput } from './auth.schema';

// Costo del hash de bcrypt, el mismo que usa el seed del usuario admin.
// 10 es el valor habitual: lento como para frenar un ataque por fuerza bruta,
// rápido como para no trabar el login.
const SALT_ROUNDS = 10;

/** Vista pública de un usuario: es lo único que sale en las respuestas de la API. */
type PublicUser = {
  id_user: number;
  username: string;
  email: string;
  rol: UserRole;
  url_avatar: string | null;
  registration_date: Date;
};

/** Respuesta de register y login: el usuario y su token recién emitido. */
type AuthResult = {
  user: PublicUser;
  token: string;
};

/**
 * Arma la vista pública de un usuario.
 *
 * Se listan los campos uno por uno a propósito: en el login el usuario se trae con
 * el scope withPassword, así que devolverlo entero filtraría el hash. Enumerar los
 * campos es la garantía de que eso no pueda pasar por descuido.
 */
function toPublicUser(user: User): PublicUser {
  return {
    id_user: user.id_user,
    username: user.username,
    email: user.email,
    rol: user.rol,
    url_avatar: user.url_avatar ?? null,
    registration_date: user.registration_date,
  };
}

export const authService = {
  /**
   * Da de alta una cuenta nueva y la deja logueada.
   * @param data username, email y contraseña en texto plano, ya validados por Zod.
   * @returns el usuario creado y su token.
   */
  async register(data: RegisterInput): Promise<AuthResult> {
    // Se chequea antes de insertar para poder decir exactamente qué campo está
    // repetido. La garantía real igual la dan los índices únicos de la tabla: si
    // dos registros entran al mismo tiempo, la base rechaza el segundo y el
    // errorHandler traduce ese error a un 409.
    if (await authRepository.findByEmail(data.email)) {
      throw new ConflictError('Ya existe una cuenta registrada con ese email.');
    }

    if (await authRepository.findByUsername(data.username)) {
      throw new ConflictError('Ese nombre de usuario ya está en uso.');
    }

    const user = await authRepository.create({
      username: data.username,
      email: data.email,
      password: await bcrypt.hash(data.password, SALT_ROUNDS),
      // El rol NO se toma nunca de la request: todo registro público entra como
      // FREE. Se sube a PRO pagando, y a ADMIN solo desde el seed.
      rol: 'FREE',
    });

    return {
      user: toPublicUser(user),
      token: signToken({ id_user: user.id_user, rol: user.rol }),
    };
  },

  /**
   * Valida las credenciales y emite un token.
   * @param data email y contraseña en texto plano.
   * @returns el usuario y su token.
   */
  async login(data: LoginInput): Promise<AuthResult> {
    const user = await authRepository.findByEmailWithPassword(data.email);

    // Mismo mensaje si el email no existe y si la contraseña está mal: cualquier
    // diferencia le serviría a un atacante para averiguar qué emails están
    // registrados en el sistema.
    const invalidCredentials = new UnauthorizedError('El email o la contraseña son incorrectos.');

    if (!user) throw invalidCredentials;

    const passwordMatches = await bcrypt.compare(data.password, user.password);
    if (!passwordMatches) throw invalidCredentials;

    return {
      user: toPublicUser(user),
      token: signToken({ id_user: user.id_user, rol: user.rol }),
    };
  },

  /**
   * Devuelve los datos del usuario dueño de un token.
   *
   * El frontend lo usa al arrancar, cuando recupera el token del storage: así se
   * entera de si sigue siendo válido y trae el rol actualizado, en vez de confiar
   * en lo que tenga guardado el navegador.
   *
   * @param id_user id que viene dentro del token verificado.
   * @returns la vista pública del usuario.
   */
  async getProfile(id_user: number): Promise<PublicUser> {
    const user = await authRepository.findById(id_user);

    // Puede pasar con un token todavía vigente de una cuenta ya dada de baja.
    if (!user) throw new NotFoundError('El usuario');

    return toPublicUser(user);
  },
};
