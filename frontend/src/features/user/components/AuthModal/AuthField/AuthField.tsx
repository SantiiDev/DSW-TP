// Un campo del modal de autenticación: la etiqueta, el input y, si hay, el
// mensaje de validación debajo. Vive dentro de la carpeta de AuthModal porque
// usa sus estilos (auth__field, auth__input...) y no tiene sentido suelto.
import type { HTMLAttributes } from 'react';
import { fieldErrorProps } from '../../../../../core/utils/validators';

type AuthFieldProps = {
  /** Id del input. El mensaje queda con id `${id}-error`, que es el que apunta
   *  el aria-describedby de fieldErrorProps. */
  id: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  autoComplete: string;
  /** Teclado del celular: "email" muestra el "@" sin usar type="email", que trae
   *  su propia validación del navegador. */
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
};

export const AuthField = ({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  inputMode,
  value,
  error,
  onChange,
}: AuthFieldProps) => {
  return (
    <div className="auth__field">
      <label htmlFor={id} className="auth__label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        className="auth__input"
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...fieldErrorProps(id, error)}
      />
      {error && (
        <p className="auth__field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};
