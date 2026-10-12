// Test del formulario de contacto.
//
// El servicio se reemplaza por un mock: el test no manda mails de verdad a
// Web3Forms. Lo que se prueba es la página: que valide antes de enviar, que el
// cartel de éxito aparezca solo si el envío salió bien, y que un error se muestre
// sin perder lo escrito.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApiError } from '../../../../core/utils/errorHandler';
import { ContactPage } from './';

vi.mock('../../services/contactService', () => ({
  contactService: { send: vi.fn() },
}));

// El marco de la página depende de la sesión y del router, que acá no importan.
vi.mock('../../../../core/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('../../../../core/components/Footer', () => ({ Footer: () => null }));
vi.mock('../../../../core/components/FadeInSection', () => ({
  FadeInSection: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { contactService } from '../../services/contactService';

/** Completa los tres campos con datos válidos. */
function fillValid() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Pérez' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'ana@correo.com' },
  });
  fireEvent.change(screen.getByLabelText('Mensaje'), {
    target: { value: 'Encontré un error en la ficha de un álbum.' },
  });
}

describe('ContactPage', () => {
  beforeEach(() => {
    vi.mocked(contactService.send).mockReset();
  });

  it('vacío muestra los errores y no envía nada', () => {
    render(<ContactPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(screen.getByText('Ingresá tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu email.')).toBeInTheDocument();
    expect(screen.getByText('Escribí tu mensaje.')).toBeInTheDocument();
    expect(contactService.send).not.toHaveBeenCalled();
  });

  it('con datos válidos envía y recién ahí muestra el éxito', async () => {
    vi.mocked(contactService.send).mockResolvedValue();
    render(<ContactPage />);

    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByText(/¡Mensaje enviado!/)).toBeInTheDocument();
    expect(contactService.send).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@correo.com',
      message: 'Encontré un error en la ficha de un álbum.',
      botcheck: false,
    });
  });

  it('si Web3Forms falla muestra el error y conserva lo escrito', async () => {
    vi.mocked(contactService.send).mockRejectedValue(
      new ApiError('No pudimos enviar tu mensaje. Probá de nuevo en unos minutos.', 400)
    );
    render(<ContactPage />);

    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByText(/No pudimos enviar tu mensaje/)).toBeInTheDocument();
    expect(screen.queryByText(/¡Mensaje enviado!/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Pérez');
  });
});
