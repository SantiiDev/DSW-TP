// Indicador de carga reutilizable por cualquier feature.
// Se usa mientras se espera una respuesta del backend, para no dejar la pantalla
// en blanco sin explicación.
import './Loader.scss';

type LoaderProps = {
  message?: string;
  // Ocupa toda la pantalla y se centra en ella. Es para cuando el Loader es lo
  // único que hay (una página que todavía no llegó, la sesión que se está
  // verificando); dentro de una sección se deja en false para que quede en línea.
  fullPage?: boolean;
};

export const Loader = ({ message = 'Cargando...', fullPage = false }: LoaderProps) => {
  return (
    // role="status" hace que un lector de pantalla anuncie el cambio de estado.
    <div className={`loader ${fullPage ? 'loader--full-page' : ''}`} role="status">
      <span className="loader__spinner" aria-hidden="true" />
      <p className="loader__message">{message}</p>
    </div>
  );
};
