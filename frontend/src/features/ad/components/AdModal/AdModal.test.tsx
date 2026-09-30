// Test unitario del panel de publicidad (Santiago Siena).
//
// Fija las tres reglas del anuncio que no se pueden leer en el backend, porque
// viven en lo que se dibuja:
//
//   1. no se puede saltar hasta que pasan cinco segundos (es lo que le da sentido
//      al beneficio Pro de no ver anuncios);
//   2. la imagen se envuelve en un enlace SOLO si el anuncio tiene destino, y de
//      distinta forma según sea externo o una ruta del sitio;
//   3. siempre ofrece el camino a /pro, que es el motivo por el que el anuncio
//      existe.
//
// El componente usa <Link>, así que el render va envuelto en un MemoryRouter. La
// cuenta regresiva se adelanta con los timers falsos de Vitest en vez de esperar
// cinco segundos de verdad.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Ad } from '../../models/Ad';
import { AdModal } from './';

/** Un anuncio de afuera, con imagen, descripción y enlace externo. */
const externalAd = new Ad(
  1,
  'Vinilos Club',
  'Un vinilo elegido a mano, en tu casa, todos los meses.',
  '/images/ads/ads-vinilos.jpg',
  'https://example.com/vinilos-club',
  true
);

const renderAd = (ad: Ad, onSkip = vi.fn()) => {
  render(
    <MemoryRouter>
      <AdModal ad={ad} onSkip={onSkip} />
    </MemoryRouter>
  );

  return onSkip;
};

/** Adelanta la cuenta regresiva segundo por segundo, como lo haría el reloj real. */
const advanceSeconds = (seconds: number) => {
  for (let i = 0; i < seconds; i += 1) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe('AdModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('se presenta como publicidad y muestra el anuncio', () => {
    renderAd(externalAd);

    // El cartel "Publicidad" no es decorativo: deja claro que no es contenido de
    // Musicboxd.
    expect(screen.getByText('Publicidad')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vinilos Club' })).toBeInTheDocument();
    expect(
      screen.getByText('Un vinilo elegido a mano, en tu casa, todos los meses.')
    ).toBeInTheDocument();
  });

  it('no deja saltar el anuncio durante los primeros cinco segundos', () => {
    renderAd(externalAd);

    const button = screen.getByRole('button', { name: 'Saltar en 5' });
    expect(button).toBeDisabled();

    // A los cuatro segundos todavía falta uno.
    advanceSeconds(4);
    expect(screen.getByRole('button', { name: 'Saltar en 1' })).toBeDisabled();
  });

  it('habilita el botón a los cinco segundos y avisa al padre al saltarlo', () => {
    const onSkip = renderAd(externalAd);

    advanceSeconds(5);

    const button = screen.getByRole('button', { name: 'Saltar anuncio' });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('abre el anuncio externo en otra pestaña, sin perder la navegación', () => {
    renderAd(externalAd);

    // La imagen es lo clickeable; su alt es el título del anuncio.
    const link = screen.getByAltText('Vinilos Club').closest('a');

    expect(link).toHaveAttribute('href', 'https://example.com/vinilos-club');
    expect(link).toHaveAttribute('target', '_blank');
    // Sin rel, la pestaña nueva queda con acceso a la ventana que la abrió.
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('el anuncio de la membresía navega dentro del sitio y no abre pestaña', () => {
    const internalAd = new Ad(
      5,
      'Musicboxd Pro',
      'Estadísticas, listas propias y cero publicidad.',
      '/images/ads/ads-musica.jpg',
      '/pro',
      true
    );

    renderAd(internalAd);
    const link = screen.getByAltText('Musicboxd Pro').closest('a');

    expect(link).toHaveAttribute('href', '/pro');
    expect(link).not.toHaveAttribute('target');
  });

  it('no envuelve la imagen en un enlace cuando el anuncio no tiene destino', () => {
    // Un <a> sin href no es un enlace y confundiría al lector de pantalla.
    const graphicAd = new Ad(2, 'Festival', null, '/images/ads/ads-festival.jpg', null, true);

    renderAd(graphicAd);

    expect(screen.getByAltText('Festival').closest('a')).toBeNull();
  });

  it('ofrece siempre el camino a Pro, que es el motivo del anuncio', () => {
    renderAd(externalAd);

    expect(screen.getByRole('link', { name: 'Eliminar publicidad' })).toHaveAttribute(
      'href',
      '/pro'
    );
  });

  it('no se anuncia como modal: el sitio se sigue usando con el anuncio en pantalla', () => {
    // Es la decisión de diseño del panel (ver AdModal.tsx) y además lo que hace que
    // AdRotator pueda distinguir un diálogo de verdad del propio anuncio.
    renderAd(externalAd);

    expect(document.querySelector('[aria-modal="true"]')).toBeNull();
  });
});
