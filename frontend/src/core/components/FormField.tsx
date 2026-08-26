// Campo de formulario reutilizable: la etiqueta y el control que va debajo.
//
// El par <label> + <input> con los mismos estilos estaba repetido en el alta de
// usuarios, el formulario de artista, el de género y el de perfil. Este archivo
// exporta las dos piezas:
//
//   FormField  la etiqueta y el hueco donde va el control (sirve para input,
//              textarea y también para el Select propio).
//   TextInput  el input (o textarea) ya estilado.
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
