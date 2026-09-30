// Test unitario del formulario de planes del panel de administración.
//
// Prueba la validación propia: con datos inválidos el formulario muestra los
// mensajes y NO llama a onSubmit (no gasta una request); con datos válidos sí,
// y con el monto ya convertido a número.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlanForm } from './PlanForm';

describe('PlanForm', () => {
  it('vacío muestra los errores de nombre y monto sin llamar a onSubmit', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PlanForm isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));

    expect(screen.getByText('El nombre del plan no puede estar vacío.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá el monto (0 si el plan es gratis).')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no muestra errores antes del primer intento de guardar', () => {
    render(<PlanForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.queryByText('El nombre del plan no puede estar vacío.')).not.toBeInTheDocument();
  });

  it('el error se va apenas el campo queda bien', () => {
    render(<PlanForm isSubmitting={false} onSubmit={vi.fn().mockResolvedValue(true)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pro' } });

    expect(screen.queryByText('El nombre del plan no puede estar vacío.')).not.toBeInTheDocument();
  });

  it('con datos válidos llama a onSubmit con el monto como número', () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PlanForm isSubmitting={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '  Pro  ' } });
    // La coma se acepta y se traduce a punto, como escribe un monto un argentino.
    fireEvent.change(screen.getByLabelText(/Monto/), { target: { value: '3500,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Pro', amount: 3500.5, description: null });
  });
});
