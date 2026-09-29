// Test unitario del selector de segmentos.
//
// Se eligió este componente porque no depende de nada: ni del router, ni del
// AuthContext, ni de la API. Se monta con un render() pelado, sin providers ni
// mocks, que es lo que hace que el test sea corto y no se rompa por motivos
// ajenos al componente.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

// Las mismas opciones que usa la cola de solicitudes del panel de administración.
const options = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
] as const;

describe('SegmentedControl', () => {
  it('renderiza un botón por cada opción', () => {
    render(
      <SegmentedControl
        options={options}
        value="pending"
        onChange={vi.fn()}
        ariaLabel="Estado de la solicitud"
      />
    );

    expect(screen.getByRole('button', { name: 'Pendientes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazadas' })).toBeInTheDocument();
  });

  it('marca como elegida solo la opción del value actual', () => {
    render(
      <SegmentedControl
        options={options}
        value="approved"
        onChange={vi.fn()}
        ariaLabel="Estado de la solicitud"
      />
    );

    // aria-pressed es lo que anuncia el lector de pantalla: visualmente se
    // distingue por el color, pero eso no llega a quien no ve la pantalla.
    expect(screen.getByRole('button', { name: 'Aprobadas' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Pendientes' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('avisa al componente padre con el valor de la opción clickeada', () => {
    // vi.fn() es un handler falso que recuerda con qué lo llamaron. Es lo que
    // permite verificar el contrato del componente: es controlado, no guarda
    // estado propio, solo avisa hacia arriba y espera un value nuevo.
    const handleChange = vi.fn();

    render(
      <SegmentedControl
        options={options}
        value="pending"
        onChange={handleChange}
        ariaLabel="Estado de la solicitud"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rechazadas' }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('rejected');
  });
});
