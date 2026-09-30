// Test unitario del alta de usuarios del panel de administración.
//
// Prueba que el formulario aplique las mismas reglas que el registro público
// (models/userRules) y que no llame a la API mientras haya un error.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CreateUserForm } from './CreateUserForm';

/** Completa los tres campos de texto del formulario. */
function fill(username: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: password } });
}

describe('CreateUserForm', () => {
  it('rechaza un usuario con espacios, un email sin dominio y una contraseña corta', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<CreateUserForm isSubmitting={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fill('Ana Pérez', 'ana@correo', 'corta');
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(
      screen.getByText(
        'El nombre de usuario solo puede tener letras, números, puntos y guiones bajos.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('El email no tiene un formato válido.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('con datos válidos llama a onSubmit con el rol elegido por defecto', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<CreateUserForm isSubmitting={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fill('ana.perez', 'ana@correo.com', 'clave-segura');
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'ana.perez',
      email: 'ana@correo.com',
      password: 'clave-segura',
      rol: 'FREE',
    });
  });
});
