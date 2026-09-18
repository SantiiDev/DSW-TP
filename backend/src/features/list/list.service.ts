// Lógica de negocio del CRUD de listas personalizadas: alta, listado filtrado,
// edición, baja, alta y baja de álbumes, y "me gusta". No conoce req ni res;
// recibe datos ya validados y al actor autenticado, y lanza errores de negocio
// que traduce el errorHandler.
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
import {
  listRepository,
  ListAlbumTarget,
  ListItemRow,
  ListOwner,
  ListUser,
  ListWithRelations,
} from './list.repository';
import { AddAlbumToListInput, CreateListInput, ListListsQuery, UpdateListInput } from './list.schema';

/** Cuántas portadas se muestran en el collage de una tarjeta de lista. */
const COLLAGE_SIZE = 5;

/** Álbum de una lista, tal como sale en el detalle. */
type PublicListAlbum = {
  id_album: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist: { id_artist: number; name: string } | null;
  position: number;
};

/**
 * Vista resumida de una lista: es lo que sale en el explorador de /lists, tanto
 * en "Top Listas" como en "Listas en Tendencia".
 *
 * `covers` siempre tiene exactamente cinco posiciones, con null en las que
 * faltan: el collage del frontend es una grilla fija de cinco celdas (ver
 * _lists-explore.scss) y así no tiene que rellenar nada por su cuenta.
 */
type PublicList = {
  id_list: number;
  name: string;
  description: string | null;
  creation_date: Date;
  user: ListUser | null;
  albums_count: number;
  likes_count: number;
  /** Si el usuario que hace la request ya le puso "me gusta". Siempre false sin sesión. */
  liked_by_me: boolean;
  covers: (string | null)[];
};

/** Vista completa de una lista: el resumen de arriba, más sus álbumes en orden. */
type PublicListDetail = PublicList & {
  albums: PublicListAlbum[];
};

/**
 * Arma la vista pública del autor de una lista.
 * @param user usuario tal como lo trajo el include.
 */
function toPublicUser(user: ListUser): ListUser {
  return {
    id_user: user.id_user,
    username: user.username,
    url_avatar: user.url_avatar ?? null,
  };
}

/**
 * Arma la vista pública de un álbum dentro de una lista.
 * @param item fila de la tabla intermedia, con el álbum ya resuelto.
 */
function toPublicListAlbum(item: ListItemRow): PublicListAlbum | null {
  const album = item.album;
  if (!album) return null;

  return {
    id_album: album.id_album,
    title: album.title,
    url_cover: album.url_cover ?? null,
    release_year: album.release_year ?? null,
    artist: album.artist ? { id_artist: album.artist.id_artist, name: album.artist.name } : null,
    position: item.position,
  };
}

/**
 * Las primeras cinco portadas de la lista, para el collage de su tarjeta.
 * Rellena con null las posiciones que faltan: el frontend dibuja esas celdas
 * como un espacio vacío en vez de tener que calcular cuántas faltan.
 */
function buildCovers(albums: PublicListAlbum[]): (string | null)[] {
  const covers = albums.slice(0, COLLAGE_SIZE).map((album) => album.url_cover);
  while (covers.length < COLLAGE_SIZE) covers.push(null);
  return covers;
}

/**
 * Arma el resumen público de una lista.
 * @param list lista de la base, con las relaciones que haya traído la consulta.
 * @param actorId id del usuario que hace la request, o null si no hay sesión.
 */
function toPublicList(list: ListWithRelations, actorId: number | null): PublicList {
  const likes = list.likes ?? [];
  const albums = (list.items ?? [])
    .map(toPublicListAlbum)
    .filter((album): album is PublicListAlbum => album !== null);

  return {
    id_list: list.id_list,
    name: list.name,
    description: list.description ?? null,
    creation_date: list.creation_date,
    user: list.user ? toPublicUser(list.user) : null,
    albums_count: albums.length,
    likes_count: likes.length,
    liked_by_me: actorId !== null && likes.some((like) => like.id_user === actorId),
    covers: buildCovers(albums),
  };
}

/** Arma el detalle público de una lista: el resumen, más sus álbumes completos. */
function toPublicListDetail(list: ListWithRelations, actorId: number | null): PublicListDetail {
  const albums = (list.items ?? [])
    .map(toPublicListAlbum)
    .filter((album): album is PublicListAlbum => album !== null);

  return { ...toPublicList(list, actorId), albums };
}

/**
 * Busca la lista por id o corta con 404 si no existe. La usan todas las
 * operaciones que reciben un :id en la URL.
 */
async function findExisting(id_list: number): Promise<ListWithRelations> {
  const list = await listRepository.findById(id_list);
  if (!list) throw new NotFoundError('La lista');
  return list;
}

/** Corta con 403 si el actor no es dueño de esa lista. */
function assertIsOwner(list: ListWithRelations, actor: TokenPayload): void {
  if (list.id_user !== actor.id_user) {
    throw new ForbiddenError('Solo podés editar tus propias listas.');
  }
}

/**
 * Corta con 403 si el actor no es dueño de la lista y tampoco es ADMIN. La baja
 * sí la puede hacer un administrador, con el mismo criterio que reviews y álbumes.
 *
 * Recibe `ListOwner` y no la lista entera porque es lo único que mira: así la
 * baja puede pedirle a la base solo de quién es.
 */
function assertCanDelete(list: ListOwner, actor: TokenPayload): void {
  if (actor.rol !== 'ADMIN' && list.id_user !== actor.id_user) {
    throw new ForbiddenError('Solo podés eliminar tus propias listas.');
  }
}

/**
 * Corta con 400 si el álbum que se quiere agregar no existe o todavía no está
 * aprobado. Mismo criterio que reviewService.assertReviewable: solo se puede
 * agregar contenido que ya pasó la moderación.
 */
function assertAddable(target: ListAlbumTarget | null): asserts target is ListAlbumTarget {
  if (!target) {
    throw new BadRequestError('El álbum que querés agregar no existe en el catálogo.');
  }

  if (target.state !== 'approved') {
    throw new BadRequestError(
      `Todavía no se puede agregar "${target.title}": un administrador tiene que aprobarlo primero.`
    );
  }
}

/**
 * Comprueba que TODOS los álbumes elegidos en el alta existan y estén aprobados.
 *
 * Se valida el lote entero ANTES de crear la lista, y no álbum por álbum a
 * medida que se insertan: si el tercero fallara a mitad de camino, la lista ya
 * estaría creada y quedaría a medio armar sin que el usuario se entere.
 *
 * @param ids álbumes elegidos, ya sin repetidos (los deduplica el schema).
 */
async function assertAllAddable(ids: number[]): Promise<void> {
  const targets = await listRepository.findAlbumTargets(ids);
  const byId = new Map(targets.map((target) => [target.id, target]));

  for (const id of ids) {
    assertAddable(byId.get(id) ?? null);
  }
}

export const listService = {
  /**
   * Crea una lista con los álbumes elegidos. No pide ningún rol en particular:
   * armar una lista es lo que hace cualquier usuario registrado, igual que
   * reseñar.
   *
   * El alta siempre trae al menos un álbum (lo exige el schema): una lista vacía
   * sería un nombre suelto, no una agrupación de álbumes.
   *
   * @param data nombre, descripción y álbumes elegidos, ya validados.
   * @param actor usuario autenticado; es el dueño de la lista.
   */
  async create(data: CreateListInput, actor: TokenPayload): Promise<PublicListDetail> {
    await assertAllAddable(data.album_ids);

    const list = await listRepository.create({
      name: data.name,
      description: data.description ?? null,
      id_user: actor.id_user,
    });

    // Las posiciones salen del orden en que el usuario los fue eligiendo, que es
    // el mismo en el que los muestra el formulario.
    await listRepository.addItems(
      data.album_ids.map((id_album, index) => ({
        id_list: list.id_list,
        id_album,
        position: index + 1,
      }))
    );

    // Se vuelve a leer para devolverla con su autor y sus álbumes ya resueltos:
    // la instancia que devuelve create() no pasó por ningún include.
    return toPublicListDetail(await findExisting(list.id_list), actor.id_user);
  },

  /**
   * Explora listas, filtradas y paginadas. Alimenta las dos secciones de
   * /lists: "Top Listas" (sort=top) y "Listas en Tendencia" (sort=recent), y el
   * filtro por género de la barra lateral.
   * @param filters género, texto, autor, orden y paginado.
   * @param actor usuario autenticado, o null si es un visitante sin sesión.
   */
  async list(filters: ListListsQuery, actor: TokenPayload | null): Promise<PublicList[]> {
    const lists = await listRepository.findAll({
      genre: filters.genre,
      q: filters.q,
      idUser: filters.id_user,
      sort: filters.sort,
      limit: filters.limit,
      offset: filters.offset,
    });

    return lists.map((list) => toPublicList(list, actor?.id_user ?? null));
  },

  /** Las listas propias, del más nuevo al más viejo. Alimenta "Mis listas" de /lists. */
  async listMine(actor: TokenPayload): Promise<PublicListDetail[]> {
    const lists = await listRepository.findAll({ idUser: actor.id_user, sort: 'recent', limit: 100 });
    return lists.map((list) => toPublicListDetail(list, actor.id_user));
  },

  /**
   * Detalle de una lista puntual, con sus álbumes en orden.
   * @param id_list lista a mostrar.
   * @param actor usuario autenticado, o null si el enlace lo abrió un visitante.
   */
  async getById(id_list: number, actor: TokenPayload | null): Promise<PublicListDetail> {
    const list = await findExisting(id_list);
    return toPublicListDetail(list, actor?.id_user ?? null);
  },

  /**
   * Cambia el nombre o la descripción de una lista. Solo su dueño.
   * @param id_list lista a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_list: number,
    actor: TokenPayload,
    data: UpdateListInput
  ): Promise<PublicListDetail> {
    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const updated = await listRepository.update(list, data);
    return toPublicListDetail(updated, actor.id_user);
  },

  /**
   * Elimina una lista. Su dueño, o un ADMIN.
   *
   * Es la única operación que NO usa `findExisting`: la respuesta es un 204 sin
   * cuerpo, así que traer la lista con su autor, sus álbumes y sus "me gusta"
   * era leer de más. Con saber que existe y de quién es alcanza.
   *
   * @param id_list lista a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_list: number, actor: TokenPayload): Promise<void> {
    const list = await listRepository.findOwner(id_list);
    if (!list) throw new NotFoundError('La lista');

    assertCanDelete(list, actor);
    await listRepository.delete(id_list);
  },

  /**
   * Agrega un álbum a una lista. Solo su dueño.
   * @param id_list lista a la que se agrega.
   * @param data el álbum a agregar, ya validado.
   * @param actor usuario autenticado que hace la request.
   */
  async addAlbum(
    id_list: number,
    data: AddAlbumToListInput,
    actor: TokenPayload
  ): Promise<PublicListDetail> {
    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const target = await listRepository.findAlbumTarget(data.id_album);
    assertAddable(target);

    const existing = await listRepository.findItem(id_list, data.id_album);
    if (existing) {
      throw new ConflictError('Ese álbum ya está en la lista.');
    }

    const position = await listRepository.nextPosition(id_list);
    await listRepository.addItem({ id_list, id_album: data.id_album, position });

    return toPublicListDetail(await findExisting(id_list), actor.id_user);
  },

  /**
   * Saca un álbum de una lista. Solo su dueño.
   * @param id_list lista de la que se saca.
   * @param id_album álbum a sacar.
   * @param actor usuario autenticado que hace la request.
   */
  async removeAlbum(
    id_list: number,
    id_album: number,
    actor: TokenPayload
  ): Promise<PublicListDetail> {
    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const item = await listRepository.findItem(id_list, id_album);
    if (!item) throw new NotFoundError('El álbum en la lista');

    await listRepository.removeItem(item);
    return toPublicListDetail(await findExisting(id_list), actor.id_user);
  },

  /**
   * Pone o saca el "me gusta" del usuario sobre una lista. Es una sola operación
   * y no un alta y una baja separadas, porque el corazón es un interruptor: el
   * frontend no tiene que saber en qué estado está para poder apretarlo.
   *
   * No hay restricción de dueño: a diferencia de editar o borrar, cualquiera
   * (incluido el propio dueño) puede darle "me gusta" a una lista, igual que
   * pasa con las reseñas.
   * @param id_list lista sobre la que se reacciona.
   * @param actor usuario autenticado.
   */
  async toggleLike(id_list: number, actor: TokenPayload): Promise<PublicListDetail> {
    await findExisting(id_list);

    const existing = await listRepository.findLike(actor.id_user, id_list);

    if (existing) await listRepository.deleteLike(existing);
    else await listRepository.createLike(actor.id_user, id_list);

    // Se vuelve a leer para que el conteo salga de la base y no de sumarle o
    // restarle uno a mano, que se desincroniza si dos personas reaccionan a la vez.
    return toPublicListDetail(await findExisting(id_list), actor.id_user);
  },
};
