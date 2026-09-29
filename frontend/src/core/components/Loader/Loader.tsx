// Indicador de carga reutilizable por cualquier feature.
// Se usa mientras se espera una respuesta del backend, para no dejar la pantalla
// en blanco sin explicación.
import './_loader.scss';

type LoaderProps = {
  message?: string;
};

export const Loader = ({ message = 'Cargando...' }: LoaderProps) => {
  return (
    // role="status" hace que un lector de pantalla anuncie el cambio de estado.
    <div className="loader" role="status">
      <span className="loader__spinner" aria-hidden="true" />
      <p className="loader__message">{message}</p>
    </div>
  );
};
