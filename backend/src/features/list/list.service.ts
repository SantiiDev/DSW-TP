// Lógica de negocio del CRUD de listas personalizadas: alta, listado filtrado,
// edición, baja, alta y baja de ítems, y "me gusta". No conoce req ni res;
// recibe datos ya validados y al actor autenticado, y lanza errores de negocio
// que traduce el errorHandler.
//
// Una lista es de álbumes O de canciones (LISTS.type). Este service no repite la
// lógica una vez por tipo: la escribe una sola vez sobre "ítems" y le pasa el
// tipo de la lista al repositorio, que es el que sabe contra qué tabla operar.
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/app-error';
import { TokenPayload } from '../../shared/auth/jwt';
// Armar listas es un beneficio de Pro, así que para confirmar que la membresía
// siga activa se relee el rol del usuario de la base en vez de creerle al token,
// igual que hace reviewService con las estadísticas avanzadas.
import { userRepository } from '../user/user.repository';
import { ListType } from '../../shared/types/enums';
import {
  listRepository,
  ListAlbumRef,
  ListItemTarget,
  ListOwner,
  ListUser,
  ListWithRelations,
} from './list.repository';
import { AddItemToListInput, CreateListInput, ListListsQuery, UpdateListInput } from './list.schema';

/** Cuántas portadas se muestran en el collage de una tarjeta de lista. */
const COLLAGE_SIZE = 5;

/**
 * Un ítem de la lista, tal como sale en el detalle. Es la misma forma para un
 * álbum y para una canción, y `kind` dice cuál de los dos es: así el frontend
 * dibuja una sola tarjeta y solo cambia a dónde enlaza.
 *
 * Una canción no tiene portada, año ni artista propios, así que los tres salen
 * de su álbum. `id_album` viaja solo en las canciones, para poder enlazar al
 * disco además de a la pista.
 */
type PublicListItem = {
  kind: ListType;
  id: number;
  title: string;
  url_cover: string | null;
  release_year: number | null;
  artist: { id_artist: number; name: string } | null;
  id_album: number | null;
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
  type: ListType;
  creation_date: Date;
  user: ListUser | null;
  items_count: number;
  likes_count: number;
  /** Si el usuario que hace la request ya le puso "me gusta". Siempre false sin sesión. */
  liked_by_me: boolean;
  covers: (string | null)[];
};

/** Vista completa de una lista: el resumen de arriba, más sus ítems en orden. */
type PublicListDetail = PublicList & {
  items: PublicListItem[];
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
 * Los datos que un ítem toma de su álbum: portada, año y artista. Para un ítem
 * álbum el álbum es él mismo; para una canción, el disco al que pertenece.
 * @param album álbum resuelto por el include, o null si la canción no tiene.
 */
function fromAlbum(album: ListAlbumRef | null | undefined) {
  return {
    url_cover: album?.url_cover ?? null,
    release_year: album?.release_year ?? null,
    artist: album?.artist ? { id_artist: album.artist.id_artist, name: album.artist.name } : null,
  };
}

/**
 * Los ítems de una lista, ya en la forma pública y ordenados por posición.
 *
 * Mira el `type` de la lista para saber cuál de los dos includes leer: el otro
 * viene siempre vacío, porque una lista solo tiene filas en la tabla intermedia
 * de su tipo.
 *
 * @param list lista de la base, con las relaciones que haya traído la consulta.
 */
function toPublicItems(list: ListWithRelations): PublicListItem[] {
  if (list.type === 'album') {
    return (list.albumItems ?? [])
      .filter((item) => item.album)
      .map((item) => ({
        kind: 'album' as const,
        id: item.album!.id_album,
        title: item.album!.title,
        ...fromAlbum(item.album),
        id_album: null,
        position: item.position,
      }));
  }

  return (list.songItems ?? [])
    .filter((item) => item.song)
    .map((item) => ({
      kind: 'song' as const,
      id: item.song!.id_song,
      title: item.song!.song_title,
      ...fromAlbum(item.song!.album),
      id_album: item.song!.album?.id_album ?? null,
      position: item.position,
    }));
}

/**
 * Las primeras cinco portadas de la lista, para el collage de su tarjeta.
 * Rellena con null las posiciones que faltan: el frontend dibuja esas celdas
 * como un espacio vacío en vez de tener que calcular cuántas faltan.
 */
function buildCovers(items: PublicListItem[]): (string | null)[] {
  const covers = items.slice(0, COLLAGE_SIZE).map((item) => item.url_cover);
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
  const items = toPublicItems(list);

  return {
    id_list: list.id_list,
    name: list.name,
    description: list.description ?? null,
    type: list.type,
    creation_date: list.creation_date,
    user: list.user ? toPublicUser(list.user) : null,
    items_count: items.length,
    likes_count: likes.length,
    liked_by_me: actorId !== null && likes.some((like) => like.id_user === actorId),
    covers: buildCovers(items),
  };
}

/** Arma el detalle público de una lista: el resumen, más sus ítems completos. */
function toPublicListDetail(list: ListWithRelations, actorId: number | null): PublicListDetail {
  return { ...toPublicList(list, actorId), items: toPublicItems(list) };
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

/**
 * Corta con 403 si el actor no puede escribir listas.
 *
 * Armar y curar listas es un beneficio de la membresía Pro: un FREE las ve, las
 * comparte y les da "me gusta", pero no las arma. Es lo mismo que ya pasa con
 * las estadísticas avanzadas.
 *
 * No alcanza con mirar el rol del token: un token emitido antes de que un ADMIN
 * le bajara el rol al usuario sigue diciendo PRO hasta que expira. Por eso, para
 * un PRO, se vuelve a leer el rol de la base. No se exige una suscripción
 * activa: un PRO asignado desde el panel de administración no tiene ninguna, y
 * es Pro igual.
 *
 * @param actor usuario autenticado que quiere escribir.
 */
async function assertCanWrite(actor: TokenPayload): Promise<void> {
  if (actor.rol === 'ADMIN') return;

  if (actor.rol !== 'PRO') {
    throw new ForbiddenError('Armar listas es un beneficio de la membresía Pro.');
  }

  const user = await userRepository.findById(actor.id_user);

  if (!user || (user.rol !== 'PRO' && user.rol !== 'ADMIN')) {
    throw new ForbiddenError('Tu membresía Pro ya no está activa, así que no podés armar listas.');
  }
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
 * Corta con 400 si el ítem que se quiere agregar no existe o todavía no está
 * aprobado. Mismo criterio que reviewService.assertReviewable: solo se puede
 * agregar contenido que ya pasó la moderación.
 *
 * @param type de qué es la lista, para poder nombrar bien lo que falta.
 */
function assertAddable(type: ListType, target: ListItemTarget | null): asserts target is ListItemTarget {
  const label = type === 'album' ? 'El álbum' : 'La canción';

  if (!target) {
    throw new BadRequestError(`${label} que querés agregar no existe en el catálogo.`);
  }

  if (target.state !== 'approved') {
    throw new BadRequestError(
      `Todavía no se puede agregar "${target.title}": un administrador tiene que aprobarlo primero.`
    );
  }
}

/**
 * Comprueba que TODOS los ítems elegidos en el alta existan y estén aprobados.
 *
 * Se valida el lote entero ANTES de crear la lista, y no ítem por ítem a medida
 * que se insertan: si el tercero fallara a mitad de camino, la lista ya estaría
 * creada y quedaría a medio armar sin que el usuario se entere.
 *
 * @param type de qué es la lista.
 * @param ids ítems elegidos, ya sin repetidos (los deduplica el schema).
 */
async function assertAllAddable(type: ListType, ids: number[]): Promise<void> {
  const targets = await listRepository.findItemTargets(type, ids);
  const byId = new Map(targets.map((target) => [target.id, target]));

  for (const id of ids) {
    assertAddable(type, byId.get(id) ?? null);
  }
}

export const listService = {
  /**
   * Crea una lista con los ítems elegidos, que son álbumes o canciones según el
   * `type` que se haya pedido. Requiere membresía Pro.
   *
   * El alta siempre trae al menos un ítem (lo exige el schema): una lista vacía
   * sería un nombre suelto, no una agrupación.
   *
   * @param data nombre, descripción, tipo e ítems elegidos, ya validados.
   * @param actor usuario autenticado; es el dueño de la lista.
   */
  async create(data: CreateListInput, actor: TokenPayload): Promise<PublicListDetail> {
    await assertCanWrite(actor);
    await assertAllAddable(data.type, data.item_ids);

    const list = await listRepository.create({
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      id_user: actor.id_user,
    });

    // Las posiciones salen del orden en que el usuario los fue eligiendo, que es
    // el mismo en el que los muestra el formulario.
    await listRepository.addItems(
      data.type,
      data.item_ids.map((id_item, index) => ({
        id_list: list.id_list,
        id_item,
        position: index + 1,
      }))
    );

    // Se vuelve a leer para devolverla con su autor y sus ítems ya resueltos:
    // la instancia que devuelve create() no pasó por ningún include.
    return toPublicListDetail(await findExisting(list.id_list), actor.id_user);
  },

  /**
   * Explora listas, filtradas y paginadas. Alimenta las dos secciones de
   * /lists: "Top Listas" (sort=top) y "Listas en Tendencia" (sort=recent), y el
   * filtro por género de la barra lateral.
   *
   * Sin filtro de `type` devuelve las de los dos tipos mezcladas, que es lo que
   * necesita "Más listas de @usuario" al pie de la ficha de una lista.
   *
   * @param filters género, texto, autor, tipo, orden y paginado.
   * @param actor usuario autenticado, o null si es un visitante sin sesión.
   */
  async list(filters: ListListsQuery, actor: TokenPayload | null): Promise<PublicList[]> {
    const lists = await listRepository.findAll({
      genre: filters.genre,
      q: filters.q,
      idUser: filters.id_user,
      type: filters.type,
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
   * Detalle de una lista puntual, con sus ítems en orden.
   * @param id_list lista a mostrar.
   * @param actor usuario autenticado, o null si el enlace lo abrió un visitante.
   */
  async getById(id_list: number, actor: TokenPayload | null): Promise<PublicListDetail> {
    const list = await findExisting(id_list);
    return toPublicListDetail(list, actor?.id_user ?? null);
  },

  /**
   * Cambia el nombre o la descripción de una lista. Solo su dueño, y con
   * membresía Pro vigente.
   *
   * El tipo no se puede cambiar: los ítems viven en la tabla intermedia de su
   * tipo, así que pasar de álbumes a canciones obligaría a vaciar la lista.
   *
   * @param id_list lista a modificar.
   * @param actor usuario autenticado que hace la request.
   * @param data campos a cambiar, ya validados por Zod.
   */
  async update(
    id_list: number,
    actor: TokenPayload,
    data: UpdateListInput
  ): Promise<PublicListDetail> {
    await assertCanWrite(actor);

    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const updated = await listRepository.update(list, data);
    return toPublicListDetail(updated, actor.id_user);
  },

  /**
   * Elimina una lista. Su dueño, o un ADMIN.
   *
   * Es la única operación que NO usa `findExisting`: la respuesta es un 204 sin
   * cuerpo, así que traer la lista con su autor, sus ítems y sus "me gusta" era
   * leer de más. Con saber que existe y de quién es alcanza.
   *
   * @param id_list lista a eliminar.
   * @param actor usuario autenticado que hace la request.
   */
  async remove(id_list: number, actor: TokenPayload): Promise<void> {
    await assertCanWrite(actor);

    const list = await listRepository.findOwner(id_list);
    if (!list) throw new NotFoundError('La lista');

    assertCanDelete(list, actor);
    await listRepository.delete(id_list);
  },

  /**
   * Agrega un ítem a una lista. Solo su dueño, y con membresía Pro vigente.
   *
   * Qué es ese ítem lo decide el `type` de la lista y no la request: a una lista
   * de canciones se le mandan ids de canción, y un id de álbum ahí adentro
   * termina en el 400 de assertAddable (no existe ninguna canción con ese id) en
   * vez de ensuciar la lista.
   *
   * @param id_list lista a la que se agrega.
   * @param data el ítem a agregar, ya validado.
   * @param actor usuario autenticado que hace la request.
   */
  async addItem(
    id_list: number,
    data: AddItemToListInput,
    actor: TokenPayload
  ): Promise<PublicListDetail> {
    await assertCanWrite(actor);

    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const target = await listRepository.findItemTarget(list.type, data.id_item);
    assertAddable(list.type, target);

    if (await listRepository.hasItem(list.type, id_list, data.id_item)) {
      throw new ConflictError(
        list.type === 'album' ? 'Ese álbum ya está en la lista.' : 'Esa canción ya está en la lista.'
      );
    }

    const position = await listRepository.nextPosition(list.type, id_list);
    await listRepository.addItem(list.type, { id_list, id_item: data.id_item, position });

    return toPublicListDetail(await findExisting(id_list), actor.id_user);
  },

  /**
   * Saca un ítem de una lista. Solo su dueño, y con membresía Pro vigente.
   * @param id_list lista de la que se saca.
   * @param id_item álbum o canción a sacar, según el tipo de la lista.
   * @param actor usuario autenticado que hace la request.
   */
  async removeItem(
    id_list: number,
    id_item: number,
    actor: TokenPayload
  ): Promise<PublicListDetail> {
    await assertCanWrite(actor);

    const list = await findExisting(id_list);
    assertIsOwner(list, actor);

    const removed = await listRepository.removeItem(list.type, id_list, id_item);
    if (!removed) {
      throw new NotFoundError(list.type === 'album' ? 'El álbum en la lista' : 'La canción en la lista');
    }

    return toPublicListDetail(await findExisting(id_list), actor.id_user);
  },

  /**
   * Pone o saca el "me gusta" del usuario sobre una lista. Es una sola operación
   * y no un alta y una baja separadas, porque el corazón es un interruptor: el
   * frontend no tiene que saber en qué estado está para poder apretarlo.
   *
   * Es la única escritura que NO pide Pro: reaccionar a una lista ajena es
   * consumirla, no armarla, igual que el "me gusta" de una reseña. Tampoco hay
   * restricción de dueño: cualquiera, incluido el propio dueño, puede darle "me
   * gusta" a una lista.
   *
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
