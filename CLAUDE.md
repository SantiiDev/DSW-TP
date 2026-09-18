# Reglas de Desarrollo — Musicboxd (DSW TP)

Estas reglas guían al agente mientras se desarrolla Musicboxd (frontend **y** backend).

## Contexto del proyecto

- Proyecto: Musicboxd, catálogo social de música y reseñas. TP de Desarrollo de Software (UTN FRRo).
- Repositorio: https://github.com/SantiiDev/DSW-TP (fork de `utnfrrodsw/tp`, monorepo con
  carpetas `frontend/` y `backend/`).
- Equipo: Santino Gallo (líder, revisa y mergea los PRs), Esterri Juan Ignacio, Siena Santiago.
- El desarrollo debe cumplir los requisitos técnicos y funcionales del TP de la cátedra
  (ver `README.md` y `FAQ.md` en la raíz del repo).

### Decisión de arquitectura clave: la base de datos propia es la fuente de verdad

Musicboxd **no consulta APIs externas de música en runtime**. La metadata de artistas, álbumes,
canciones y géneros se carga **una única vez** mediante un script de seed (`backend/src/seed/`)
que se ejecuta a mano con `npm run seed`.

Consecuencias obligatorias:

- Ningún endpoint de la API ni ningún componente del frontend debe llamar a Spotify, Deezer,
  MusicBrainz ni ninguna otra API de metadata musical.
- Los CRUD de Artista, Álbum, Canción y Género operan **siempre** sobre tablas propias.
- El seed guarda su respuesta cruda en `backend/src/seed/data/*.json`, versionada en git, para que
  el proceso sea reproducible sin conexión a internet.

### División de trabajo por feature (evitar conflictos de merge)

- Santino → `user`, `membership` (plan, subscription, payment), auth
- Esterri → `artist`, `album`
- Siena → `genre`, `review`

No modificar ni reescribir código de la feature de otro integrante sin que se pida explícitamente.

## Stack obligatorio (no cambiar sin pedido explícito del usuario)

### Frontend

- Vite + React, **en TypeScript** (`.ts` / `.tsx`). No crear archivos `.js` / `.jsx` nuevos.
- Enrutamiento: React Router.
- Estado: Context API + `useReducer` para estado compartido/global; `useState` para estado local
  de componente.
- Estilos: SASS/SCSS con arquitectura 7-1. Nada de CSS-in-JS, styled-components, Tailwind u otro
  framework de estilos salvo pedido explícito.
- Sin librerías de componentes (MUI, Bootstrap, Chakra, etc.) salvo pedido explícito.
- Sin librerías externas de estado (Redux, Zustand, Recoil, etc.).

### Backend

- Node + **Express** + **TypeScript**.
- ORM: **Sequelize v6**, tipando las entidades con `InferAttributes` / `InferCreationAttributes`
  (tipado nativo de Sequelize). No usar `sequelize-typescript` ni decoradores.
- Base de datos: **MySQL** en servicio cloud gestionado (Aiven). Nunca una DB embebida ni local.
  La conexión requiere SSL: configurar `dialectOptions.ssl` con el CA que provee el servicio.
- Validación de entrada: **Zod**, aplicada mediante un middleware antes del controller.
- Autenticación: JWT propio + bcrypt para el hash de contraseñas.
- Pasarela de pago: MercadoPago Checkout Pro (sandbox) con webhook. Se le habla con
  `fetch` (viene con Node), sin el SDK: son dos llamadas y así se ve qué se manda.
  La membresía es mensual con **renovación manual**, no débito automático: el cobro
  recurrente es otro producto de MercadoPago (`preapproval`) y necesitaría una
  columna en el DER para el id de la suscripción externa. Ver la sección
  "Membresías y pasarela de pago" del README del backend.

### Regla común

- No agregar ninguna dependencia nueva sin avisar antes al usuario.

## Estructura de carpetas

### Frontend

Ya está creada (`src/core/`, `src/features/<feature>/{components,models,pages,services,styles}`).
No modificar ni alterar las carpetas sin antes preguntar.

### Backend

Misma idea que el frontend: **`features/` es el dominio y `shared/` es lo transversal**
(el equivalente de `core/`). No agregar carpetas nuevas en la raíz de `src/`: una feature
nueva es una carpeta adentro de `features/`.

```
backend/src/
  server.ts          arranque: conecta a la DB y escucha
  app.ts             configuración de Express
  routes.ts          monta el router de cada feature
  features/          una carpeta por entidad, con sus cinco capas:
    <feature>/       <x>.routes.ts, <x>.controller.ts, <x>.service.ts,
                     <x>.repository.ts, <x>.schema.ts
  entities/          modelos de Sequelize (User, Plan, Subscription, Payment,
                     Artist, Genre, Album, Song, Review) + index.ts con TODAS
                     las asociaciones
  shared/            middlewares (auth, requireRole, validate, errorHandler),
                     config de la DB, errores, tipos comunes
  seed/              carga inicial de datos + data/*.json
  scripts/           mantenimiento de la base (reset, índices, migraciones)
```

Separación de capas estricta: **routes → controller → service → repository → entity**.
El controller no arma queries; el service no toca `req` ni `res`.

Dos reglas de ubicación que no son obvias:

- **`entities/` va afuera de `features/`**, aunque en el frontend los modelos vivan dentro
  de cada feature. Las entidades de Sequelize son un grafo conectado y `entities/index.ts`
  declara todas las asociaciones en un solo lugar para evitar imports circulares. Meterlas
  en las features haría que `review` importe de `album`, `song` y `user`, y `album` de
  `artist` y `genre`.
- **`seed/` no es `scripts/`**: en `seed/` va lo que carga datos iniciales; en `scripts/`,
  las tareas de mantenimiento de la base (borrar y recrear, arreglar índices, migraciones).

## Nomenclatura

- Identificadores de código (variables, funciones, componentes, archivos, carpetas): **en inglés**.
- Ramas de git: en inglés, `feature/<issue-number>-<short-description>` (ej: `feature/4-artist-crud`).
- Frontend: componentes en PascalCase (`ArtistCard.tsx`); hooks en camelCase con prefijo `use`
  (`useArtistList.ts`); parciales de estilos en kebab-case (`_artist-card.scss`).
- Backend: archivos en kebab-case con sufijo de capa (`album.controller.ts`, `album.service.ts`).
- Comentarios: se permite español para que todo el equipo los entienda fácil, pero deben ser
  claros, breves y en el mismo idioma dentro de un mismo archivo.

## Comentarios obligatorios en el código

- Al inicio de cada componente/archivo: una línea explicando qué hace ese archivo.
- Antes de cada función no trivial: comentario breve de qué recibe y qué devuelve.
- En lógica no obvia (transformaciones de datos, condicionales complejos, efectos): explicar el
  "por qué", no repetir el "qué" ya evidente en el código.
- No comentar cosas obvias (ej: `// declara una variable`).

## Componentes (frontend)

- Solo componentes funcionales con Hooks. Nada de componentes de clase.
- Un componente = una responsabilidad. Si supera ~150-200 líneas o mezcla mucha lógica, dividirlo.
- Props tipadas con un `type` propio y destructuring en la firma del componente.
- Handlers de eventos con prefijo `handle` (`handleClick`, `handleInputChange`).
- Todo fetch/servicio debe manejar estados de `loading`, `error` y datos vacíos, mostrando mensajes
  amigables en la UI (nunca un error crudo de consola).

## Modelado de datos (frontend)

- Representar los datos que van/vienen de la API con **clases** en `features/<x>/models/`.
  Ejemplo: `class Artist { constructor(public id: number, public name: string) {} }`.
- Los servicios (`services/xxxService.ts`) mapean la respuesta cruda del backend a estos modelos;
  el resto de la app nunca ve el JSON crudo.
- Cada feature debe tener al menos un servicio propio que centralice sus llamadas HTTP, y ese
  servicio debe usar el `httpClient` compartido de `core/services/`, no `fetch` directo.

## API y errores (backend)

- API REST con rutas en plural y en inglés (`/api/albums`, `/api/albums/:id/songs`).
- Códigos de estado correctos: 200/201/204, 400 (validación), 401, 403, 404, 409, 500.
- Formato de error único en toda la API: `{ message: string, errors?: unknown }`.
- Un único middleware de manejo de errores al final del stack de Express: los controllers no
  arman respuestas de error a mano, tiran el error y lo captura el middleware.
- Nunca devolver el hash de contraseña ni datos sensibles en las respuestas.

## Niveles de acceso

`USERS.rol` ∈ `FREE | PRO | ADMIN`.

- Rutas de escritura de catálogo (artista, álbum, canción): requieren `PRO` o `ADMIN`.
- Contenido creado por un `PRO` entra con `state = 'pending'` y solo un `ADMIN` lo aprueba.
- Rutas de moderación y de gestión de planes: solo `ADMIN`.
- El frontend replica esta protección con un componente `ProtectedRoute`, pero **la validación
  real vive siempre en el backend**.

## Estilos (SASS 7-1)

- Mobile-first: primero los estilos para mobile, después media queries para ampliar (`min-width`).
- Breakpoints sugeridos: SM ≥576px, MD ≥768px, LG ≥1024px, como variables SASS en
  `abstracts/_breakpoints.scss`.
- Variables SASS para colores, espaciados y tipografía (`abstracts/_variables.scss`); nada de
  valores hardcodeados repetidos.
- Convención de clases consistente (BEM u otra) dentro de cada componente.

## Buenas prácticas generales

- SUPER IMPORTANTE: No usar patrones o features "avanzados" que excedan el nivel de la materia
  (Server Components, Suspense para data fetching, arquitecturas exageradas, event sourcing, etc.).
  Priorizar código claro y directo por sobre "elegante pero complejo": el código lo tiene que
  poder explicar un estudiante en la defensa oral.
- Reutilizar componentes comunes (inputs, botones, cards) desde `core/components` en vez de
  duplicar código entre features.
- No dejar datos hardcodeados en componentes: todo dato de negocio viene de la API.

## Variables de entorno

- Frontend: `.env` con prefijo `VITE_` para la URL base de la API. Nunca hardcodear URLs.
- Backend: `.env` con `DATABASE_URL`, `JWT_SECRET`, `PORT`, credenciales de MercadoPago y del
  servicio de metadata usado por el seed.
- Mantener siempre un `.env.example` actualizado y **nunca** commitear el `.env` real.

## Testing

- No es obligatorio para regularidad. Para la etapa de aprobación se necesita:
  - Backend: 1 test automatizado por integrante (3) + 1 test de integración.
  - Frontend: 1 test unitario de un componente + 1 test end-to-end.
- Herramientas recomendadas: Vitest + React Testing Library en frontend (integra nativo con Vite),
  Vitest + Supertest en backend, Playwright para el E2E.

## Git / Pull Requests

- Ramas desde `develop`, nombre en inglés.
- PR con descripción breve de qué se hizo y por qué.
- No mergear directo a `main`. Santino revisa y hace squash-merge de los PRs a `develop`.
- Cada PR debe estar vinculado a su issue en el GitHub Project del equipo.

## Qué NO hacer

- No llamar a APIs externas de metadata musical fuera del script de seed.
- No crear archivos `.js` / `.jsx` nuevos en el frontend: el proyecto es TypeScript.
- No sumar librerías de UI, estado o estilos fuera del stack definido arriba.
- No saltear capas en el backend (por ejemplo, un controller consultando el modelo directamente).
- SUPER IMPORTANTE: No inventar arquitecturas o patrones que un estudiante de una materia de DSW
  no manejaría: mantenerlo simple, legible y explicable.
- No tocar ni reescribir la feature de otro integrante sin que se pida explícitamente.
