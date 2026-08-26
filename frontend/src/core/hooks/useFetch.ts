// Hook para traer datos de la API.
//
// El mismo bloque de siete líneas (prender loading, limpiar el error, pedir,
// guardar, atrapar, apagar loading) estaba copiado en cada pantalla que carga
// algo. Acá está una sola vez, con el error ya traducido a un mensaje mostrable
// por getErrorMessage.
//
//   const { data, isLoading, error, reload } = useFetch(() => genreService.list());
//   const genres = data ?? [];
//
// Si lo que se pide depende de algo que puede cambiar (un id de la URL, el filtro
// elegido), ese valor se pasa como segunda parte: cuando cambia, se vuelve a
// pedir solo.
//
//   useFetch(() => artistService.list({ state }), state);
//
// `reload` sirve para volver a pedir después de crear, editar o borrar algo, y
// `setData` para actualizar una fila sin gastar otra request.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

type UseFetchResult<T> = {
  /** null hasta que llega la primera respuesta, o si la carga falló. */
  data: T | null;
  isLoading: boolean;
  /** Mensaje ya listo para mostrar, o null si no hubo error. */
  error: string | null;
  /** Vuelve a ejecutar la carga (después de un alta, una baja, etc.). */
  reload: () => Promise<void>;
  /** Modifica los datos en memoria sin volver a pedirlos a la API. */
  setData: Dispatch<SetStateAction<T | null>>;
  /** Permite mostrar en el mismo lugar el error de otra operación. */
  setError: Dispatch<SetStateAction<string | null>>;
};

/**
 * Trae datos y expone el estado de esa carga.
 *
 * @param fetcher función que hace la request.
 * @param key valor del que depende lo que se pide (un id, un filtro). Al
 *   cambiar, se vuelve a pedir. Si lo que se pide no depende de nada, se omite.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  key: string | number = ''
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El fetcher se guarda en una ref y no se usa como dependencia porque es una
  // función nueva en cada render: si estuviera en las dependencias, cada carga
  // provocaría la siguiente y no pararía nunca. La ref se actualiza en un efecto
  // (y no en el cuerpo) para no escribir durante el render.
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await fetcherRef.current());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar (y cada vez que cambia la clave) es justamente para lo que
  // sirve un efecto: sincronizar el componente con un sistema externo, que acá
  // es la API. La regla que lo desaconseja apunta a otro caso, el de calcular
  // estado a partir de otro estado.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload, key]);

  return { data, isLoading, error, reload, setData, setError };
}
