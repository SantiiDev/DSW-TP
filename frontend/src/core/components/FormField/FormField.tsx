// Campo de formulario reutilizable: la etiqueta y el control que va debajo.
//
// El par <label> + <input> con los mismos estilos estaba repetido en el alta de
// usuarios, el formulario de artista, el de género y el de perfil. Este archivo
// exporta las dos piezas:
//
//   FormField    la etiqueta y el hueco donde va el control (sirve para input,
//                textarea y también para el Select propio).
//   TextInput    el input (o textarea) ya estilado.
//   NumberInput  un campo para escribir números, sin las flechitas del navegador.
//
//   <FormField id="genre-name" label="Nombre">
//     <TextInput id="genre-name" value={name} onChange={...} required />
//   </FormField>
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import './_form-field.scss';

type FormFieldProps = {
  /** Debe coincidir con el id del control, para que el label lo active. */
  id: string;
  label: string;
  /** Aclaración al lado de la etiqueta, por ejemplo "(opcional)". */
  hint?: string;
  children: ReactNode;
};

export const FormField = ({ id, label, hint, children }: FormFieldProps) => {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
        {hint && <span className="form-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
};

type TextInputProps =
  | ({ as?: 'input' } & InputHTMLAttributes<HTMLInputElement>)
  | ({ as: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>);

/**
 * Input de texto con los estilos del sitio. Con `as="textarea"` dibuja un
 * textarea en vez de un input, que es la única diferencia entre los dos.
 */
export const TextInput = ({ as = 'input', className = '', ...rest }: TextInputProps) => {
  const classes = ['form-field__control', className].filter(Boolean).join(' ');

  if (as === 'textarea') {
    return (
      <textarea
        className={`${classes} form-field__control--textarea`}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return <input className={classes} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
};

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  /** El valor va como texto: el campo puede estar vacío, y '' no es un número. */
  value: string;
  /** Recibe el valor ya filtrado, sin nada que no sea un dígito. */
  onValueChange: (value: string) => void;
};

/**
 * Campo para escribir un número (un año, un número de pista, una duración).
 *
 * NO es un <input type="number"> a propósito. Ese trae las flechitas de subir y
 * bajar del navegador, que para cargar un año como 1991 obligan a un scroll
 * larguísimo o a pelearse con la ruedita del mouse; además, si se lo scrollea sin
 * querer estando enfocado, cambia el valor solo.
 *
 * En su lugar es un campo de texto con `inputMode="numeric"`, que en el celular
 * abre igual el teclado numérico, y que descarta cualquier carácter que no sea un
 * dígito a medida que se escribe. Los límites de verdad (rango del año, pista
 * mayor a cero) los sigue validando el backend.
 */
export const NumberInput = ({
  value,
  onValueChange,
  className = '',
  ...rest
}: NumberInputProps) => {
  return (
    <input
      type="text"
      inputMode="numeric"
      className={['form-field__control', className].filter(Boolean).join(' ')}
      value={value}
      onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ''))}
      {...rest}
    />
  );
};
