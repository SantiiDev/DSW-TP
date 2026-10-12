// Punto de entrada principal de la aplicación (main.tsx).
// Se encarga de inicializar React, montar el árbol de componentes en el DOM (elemento 'root'),
// e inyectar el enrutador base (BrowserRouter) que gestionará la navegación del Frontend.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import { App } from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
