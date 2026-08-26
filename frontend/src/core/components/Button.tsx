// Botón reutilizable de toda la app.
//
// Antes cada feature definía su propio botón en su .scss (submit-btn, cancel-btn,
// delete-btn, approve-btn...) copiando casi carácter por carácter el mismo bloque
// de estilos. Acá vive una sola vez, y las features eligen apariencia con
// `variant` y tamaño con `size`.
//
//   <Button variant="primary" disabled={isSubmitting}>Guardar</Button>
//   <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
//
// Acepta además cualquier prop nativa de <button> (type, disabled, onClick,
// aria-*), así ninguna pantalla necesita envolverlo para agregarle algo.
import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './_button.scss';

/**
 * Apariencia del botón:
 * - primary: relleno verde, la acción principal de un formulario o una barra.
 * - outline: borde neutro y texto blanco, para acciones secundarias con peso
 *   (editar una fila, "ver más").
 * - subtle:  borde neutro y texto atenuado, para salidas sin consecuencias
 *   (cancelar, descartar).
 * - danger:  rojo, para lo destructivo (eliminar, suspender, rechazar).
 * - success: verde con borde, para lo que habilita o aprueba.
 */
export type ButtonVariant = 'primary' | 'outline' | 'subtle' | 'danger' | 'success';

/**
 * sm para acciones dentro de tablas y barras, md para formularios y lg para la
 * acción principal de una pantalla (el submit del modal de acceso).
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Opciones de apariencia; las comparten el botón y el link con forma de botón. */
type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho disponible (formularios angostos, tarjetas). */
  fullWidth?: boolean;
  className?: string;
};

/** Arma la lista de clases. Está aparte porque la usan Button y ButtonLink. */
function buildClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonStyleProps): string {
  return ['btn', `btn--${variant}`, `btn--${size}`, fullWidth ? 'btn--full' : '', className]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = ButtonStyleProps & {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  variant,
  size,
  fullWidth,
  className,
  children,
  // type="button" por defecto a propósito: el default del navegador es "submit",
  // y un botón suelto dentro de un <form> terminaba enviándolo sin querer.
  type = 'button',
  ...rest
}: ButtonProps) => {
  return (
    <button type={type} className={buildClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
};

type ButtonLinkProps = ButtonStyleProps & {
  /** Ruta interna a la que navega. */
  to: string;
  children: ReactNode;
};

/**
 * Link de React Router con la apariencia de un botón.
 *
 * Existe porque varias acciones principales navegan en vez de ejecutar algo
 * ("Explorar música", "Mejorar mi plan"): tienen que verse como un botón pero
 * ser un <a> de verdad, para que se puedan abrir en otra pestaña y el lector de
 * pantalla los anuncie como enlaces.
 */
export const ButtonLink = ({
  to,
  variant,
  size,
  fullWidth,
  className,
  children,
}: ButtonLinkProps) => {
  return (
    <Link to={to} className={buildClasses({ variant, size, fullWidth, className })}>
      {children}
    </Link>
  );
};
