// defineConfig se importa de vitest/config y no de vite: es el mismo, pero
// además tipa el bloque test. Así los tests reutilizan los plugins de React de
// acá abajo en vez de repetirlos en un vitest.config.ts aparte.
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    // Los tests de componentes necesitan un DOM: en Node no existen document
    // ni window, y render() de Testing Library no tendría dónde montar nada.
    environment: 'jsdom',
    setupFiles: './src/vitest.setup.ts',
    // Solo los tests de componentes. Sin este filtro Vitest también levantaría
    // los .spec.ts de e2e/, que son de Playwright y fallarían.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
