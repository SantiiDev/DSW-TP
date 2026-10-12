// Test unitario del schema de listas personalizadas (Santiago Siena).
//
// Prueba las reglas que hacen de "listas" un CRUD de verdad y no un formulario
// suelto: el nombre obligatorio, el tipo de lista (de álbumes o de canciones),
// la descripción vacía traducida a null (mismo criterio que text_review en
// review.schema.ts), el "al menos un campo" de la edición y el tope del paginado
// del explorador.
import { describe, expect, it } from 'vitest';
import { createListSchema, listListsQuerySchema, updateListSchema } from '../../src/features/list/list.schema';

describe('createListSchema', () => {
  it('acepta una lista de álbumes con nombre y un ítem', () => {
    const result = createListSchema.safeParse({
      name: 'Favoritos del Rock Nacional',
      type: 'album',
      item_ids: [7],
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeUndefined();
  });

  it('acepta una lista de canciones, con el mismo campo de ítems', () => {
    // Los ids son de canción y no de álbum, pero el schema es el mismo: qué son
    // esos ids lo decide `type`, y contra qué tabla se resuelven, el service.
    const result = createListSchema.safeParse({
      name: 'Para manejar de noche',
      type: 'song',
      item_ids: [12, 40],
    });

    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('song');
  });

  it('rechaza el alta si no se dice de qué es la lista', () => {
    // Sin tipo no se sabe en qué tabla intermedia van sus ítems: es lo que
    // impide que una lista tenga álbumes y canciones a la vez.
    const result = createListSchema.safeParse({ name: 'Joyas ocultas', item_ids: [7] });

    expect(result.success).toBe(false);
  });

  it('rechaza un tipo de lista que no existe', () => {
    const result = createListSchema.safeParse({
      name: 'Joyas ocultas',
      type: 'artist',
      item_ids: [7],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Una lista tiene que ser de álbumes o de canciones.'
    );
  });

  it('rechaza el nombre vacío', () => {
    const result = createListSchema.safeParse({ name: '   ', type: 'album', item_ids: [7] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El nombre de la lista no puede estar vacío.');
  });

  it('rechaza una lista sin ningún ítem', () => {
    // Una lista vacía no es una agrupación, es un nombre suelto.
    const result = createListSchema.safeParse({ name: 'Joyas ocultas', type: 'album', item_ids: [] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Una lista tiene que tener al menos un álbum o una canción.'
    );
  });

  it('rechaza el alta si ni siquiera se manda la lista de ítems', () => {
    const result = createListSchema.safeParse({ name: 'Joyas ocultas', type: 'album' });

    expect(result.success).toBe(false);
  });

  it('descarta los ítems repetidos, que chocarían contra la PK compuesta', () => {
    const result = createListSchema.safeParse({
      name: 'Esenciales',
      type: 'album',
      item_ids: [4, 9, 4],
    });

    expect(result.success).toBe(true);
    expect(result.data?.item_ids).toEqual([4, 9]);
  });

  it('convierte la descripción vacía a null, como manda el formulario sin completar', () => {
    const result = createListSchema.safeParse({
      name: 'Joyas ocultas',
      description: '',
      type: 'album',
      item_ids: [7],
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeNull();
  });
});

describe('updateListSchema', () => {
  it('rechaza un PATCH sin ningún campo', () => {
    // Un PATCH vacío no pide ningún cambio: es casi seguro un error del cliente.
    const result = updateListSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Hay que enviar al menos un campo para actualizar.');
  });

  it('acepta cambiar solo la descripción', () => {
    const result = updateListSchema.safeParse({ description: 'Actualizada' });

    expect(result.success).toBe(true);
  });

  it('ignora el tipo: una lista no puede cambiar de álbumes a canciones', () => {
    // Sus ítems viven en la tabla intermedia de su tipo, así que cambiarlo
    // obligaría a vaciarla. El schema no lo acepta, y como Zod descarta las
    // claves que no declara, el `type` que venga en el body no llega al service.
    const result = updateListSchema.safeParse({ name: 'Otro nombre', type: 'song' });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('type');
  });
});

describe('listListsQuerySchema — paginado', () => {
  it('trae diez listas cuando no se pide un tope', () => {
    const result = listListsQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(10);
    expect(result.data?.offset).toBe(0);
  });

  it('no deja pedir más de cincuenta listas por tanda', () => {
    const result = listListsQuerySchema.safeParse({ limit: '100' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El tope no puede ser mayor a 50.');
  });

  it('rechaza un orden que no sea "recent" ni "top"', () => {
    const result = listListsQuerySchema.safeParse({ sort: 'popular' });

    expect(result.success).toBe(false);
  });

  it('sin filtro de tipo devuelve las listas de los dos tipos', () => {
    // Es lo que necesita "Más listas de @usuario": ahí se muestra todo lo que
    // armó esa persona, sean listas de álbumes o de canciones.
    const result = listListsQuerySchema.safeParse({ id_user: '2' });

    expect(result.success).toBe(true);
    expect(result.data?.type).toBeUndefined();
  });
});
