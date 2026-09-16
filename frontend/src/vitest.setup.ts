// Se ejecuta antes de cada archivo de test (lo engancha el bloque test de
// vite.config.ts).
//
// Vive adentro de src/ a propósito: tsconfig.app.json incluye "src", y es eso
// lo que hace que TypeScript vea los tipos de los matchers de jest-dom.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Agrega los matchers de jest-dom al expect de Vitest: son los que permiten
// escribir toBeInTheDocument() o toHaveAttribute() en vez de mirar propiedades
// del nodo a mano.
import '@testing-library/jest-dom/vitest';

// Desmonta lo que renderizó el test anterior. Testing Library lo hace sola
// cuando Vitest corre con globals, pero acá los helpers se importan explícitos,
// así que hay que engancharlo a mano: si no, el segundo test encuentra dos
// copias de cada botón y getByRole falla por ambiguo.
afterEach(() => {
  cleanup();
});
