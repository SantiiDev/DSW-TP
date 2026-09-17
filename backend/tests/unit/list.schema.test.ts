// Test unitario del schema de listas personalizadas (Santiago Siena).
//
// Prueba las reglas que hacen de "listas" un CRUD de verdad y no un formulario
// suelto: el nombre obligatorio, la descripción vacía traducida a null (mismo
// criterio que text_review en review.schema.ts), el "al menos un campo" de la
// edición y el tope del paginado del explorador.
import { describe, expect, it } from 'vitest';
import { createListSchema, listListsQuerySchema, updateListSchema } from '../../src/features/list/list.schema';

describe('createListSchema', () => {
  it('acepta una lista con nombre y un álbum', () => {
    const result = createListSchema.safeParse({
      name: 'Favoritos del Rock Nacional',
      album_ids: [7],
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBeUndefined();
  });

  it('rechaza el nombre vacío', () => {
    const result = createListSchema.safeParse({ name: '   ', album_ids: [7] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El nombre de la lista no puede estar vacío.');
  });

  it('rechaza una lista sin ningún álbum', () => {
    // Una lista vacía no es una agrupación de álbumes, es un nombre suelto.
    const result = createListSchema.safeParse({ name: 'Joyas ocultas', album_ids: [] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Una lista tiene que tener al menos un álbum.');
  });

  it('rechaza el alta si ni siquiera se manda la lista de álbumes', () => {
    const result = createListSchema.safeParse({ name: 'Joyas ocultas' });

    expect(result.success).toBe(false);
  });

  it('descarta los álbumes repetidos, que chocarían contra la PK compuesta', () => {
    const result = createListSchema.safeParse({ name: 'Esenciales', album_ids: [4, 9, 4] });

    expect(result.success).toBe(true);
    expect(result.data?.album_ids).toEqual([4, 9]);
  });

  it('convierte la descripción vacía a null, como manda el formulario sin completar', () => {
    const result = createListSchema.safeParse({
      name: 'Joyas ocultas',
      description: '',
      album_ids: [7],
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
});
