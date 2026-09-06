# Musicboxd — Frontend

Aplicación web de Musicboxd: **Vite + React + TypeScript**, React Router, Context API
con `useReducer` para el estado global y SASS con arquitectura 7-1.

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

Levanta en `http://localhost:5173`. El backend tiene que estar corriendo en el
puerto 3000 (ver [`../backend/README.md`](../backend/README.md)): el frontend no
consulta ninguna API externa, todo sale de nuestra propia API.

### Variables de entorno

| Variable       | Descripción                                                   |
| :------------- | :------------------------------------------------------------ |
| `VITE_API_URL` | URL base de la API, incluyendo `/api`. Nunca se hardcodea la URL |

## Scripts

| Script            | Qué hace                                    |
| :---------------- | :------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo con HMR              |
| `npm run build`   | Chequeo de tipos (`tsc -b`) + build de Vite |
| `npm run lint`    | ESLint sobre todo el proyecto               |
| `npm run preview` | Sirve el build de producción                |

## Estructura

```
src/
  app/App.tsx       Rutas y providers globales
  core/
    components/     Componentes reutilizables por todas las features
                    (Navbar, Footer, Loader, ProtectedRoute, Tabs, ...)
    context/        Estado global: AuthContext (sesión), AuthModalContext (modal)
    services/       httpClient (único punto de salida HTTP) y tokenStorage
    utils/          ApiError y traducción de errores a mensajes de pantalla
  features/<x>/     Una carpeta por entidad del dominio:
    components/     Componentes propios de la feature
    models/         Clases que representan los datos de la API
    pages/          Páginas enrutadas
    services/       Llamadas HTTP de la feature (usan el httpClient)
    styles/         Parciales SCSS de la feature
  styles/           7-1: abstracts (variables, breakpoints, mixins), base, main.scss
```

## Cómo hablar con la API

Ningún componente usa `fetch` directo: **todo pasa por el `httpClient`**, que arma
la URL, adjunta el token de sesión si hay alguien logueado y convierte cualquier
respuesta con error en un `ApiError`.

El servicio de la feature es el único que ve el JSON crudo: lo mapea a la clase del
modelo y devuelve eso.

```ts
// features/album/services/albumService.ts
import { httpClient } from '../../../core/services/httpClient';
import { Album } from '../models/Album';
import type { AlbumApiResponse } from '../models/Album';

export const albumService = {
  async findAll(): Promise<Album[]> {
    const data = await httpClient.get<AlbumApiResponse[]>('/albums');
    return data.map((item) => new Album(item.id_album, item.title));
  },
};
```

En el componente se manejan siempre los tres estados: cargando, error y sin datos.

```tsx
const [albums, setAlbums] = useState<Album[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  albumService
    .findAll()
    .then(setAlbums)
    .catch((err) => setError(getErrorMessage(err)))
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <Loader />;
if (error) return <p className="error">{error}</p>;
if (albums.length === 0) return <p>Todavía no hay álbumes cargados.</p>;
```

## Sesión del usuario

El `AuthContext` es la única fuente de verdad de quién está logueado. Cualquier
componente lo lee con el hook `useAuth`:

```tsx
const { state, login, register, logout } = useAuth();

state.status;       // 'checking' | 'authenticated' | 'guest'
state.user;         // instancia de User, o null
state.isSubmitting; // hay un login/registro en curso
state.error;        // mensaje del último intento fallido, listo para mostrar
```

El token se guarda en `localStorage` y el `httpClient` lo adjunta solo en cada
request. Al abrir la app, el contexto le pregunta a `GET /auth/me` si ese token
sigue siendo válido, en vez de confiar en lo que haya guardado el navegador.

### Rutas privadas

```tsx
<Route path="/profile" element={
  <ProtectedRoute><UserProfilePage /></ProtectedRoute>
} />

<Route path="/admin/moderation" element={
  <ProtectedRoute roles={['ADMIN']}><ModerationPage /></ProtectedRoute>
} />
```

`ProtectedRoute` es **solo para la experiencia de usuario**: evita mostrar pantallas
que el usuario no va a poder usar. La validación que importa es la del backend
(`requireAuth` y `requireRole`), porque el estado del navegador se puede editar pero
la firma de un token no se puede falsificar.

### La excepción: `/reviews/:id`

Casi todo el catálogo pide sesión, pero la página de una reseña es **pública**, y a
propósito: es el destino del botón "Compartir", así que el enlace lo tiene que poder
abrir alguien que todavía no tiene cuenta (la API de ese detalle también es pública).

Adentro, lo que lleva al catálogo va con `GatedLink`, el mismo componente que usan
las tarjetas del explorador: con sesión navega, y sin sesión abre el modal de
registro. Así un enlace compartido se lee entero y desde ahí se entra al sitio, en
vez de rebotar contra una pantalla de login.

Las columnas de "más reseñas" son la única parte que no se muestra sin sesión: el
listado de reseñas sí exige token. En su lugar va la invitación a registrarse.

### Pantallas que cambian según la sesión

No todo se resuelve bloqueando una ruta: hay pantallas públicas cuyo contenido tiene
que cambiar según quién mire. La regla es simple: **a quien ya inició sesión no se le
ofrece iniciar sesión**, y a quien ya es Pro no se le vende Pro.

| Pantalla | Visitante | Con sesión |
| :------- | :-------- | :--------- |
| Navbar | "Iniciar sesión" y "Registrarse" | avatar con el menú de la cuenta |
| Home (`Hero`, `CallToAction`) | invitación a registrarse | saludo por nombre y accesos a su perfil y al catálogo |
| `/members` | botón "Unirse a la comunidad" | sin botón: ya es parte |
| `/pro` | `ProSalesView`, el pitch del plan | Free: mismo pitch, pero el botón dice "Pasarme a Pro"<br>Pro/Admin: `ProMemberView`, el área de socio |

Como red de seguridad, `openLogin` y `openSignup` del `AuthModalContext` no hacen
nada si ya hay sesión: así ningún botón que se haya pasado por alto puede abrir el
modal de registro a alguien que ya entró.

### Panel de administración (`/admin`)

Solo para `ADMIN` (`<ProtectedRoute roles={['ADMIN']}>`). Adentro se divide en tres
pestañas, cada una con su propio componente de panel:

| Pestaña | Componente | Estado |
| :------ | :--------- | :----- |
| Usuarios | `AdminUsersPanel` | funcionando contra `/api/users` |
| Música | `AdminMusicPanel` | shell listo; espera los endpoints de artista, álbum y canción |
| Solicitudes | `AdminRequestsPanel` | shell listo; espera la moderación de aportes (CUU 3) |

La página solo decide qué pestaña está activa: **cada panel pide sus propios datos**,
así abrir el panel no dispara las requests de las tres áreas a la vez.

La barra de pestañas es el componente compartido `core/components/Tabs`, el mismo que
usa el perfil: si cambia el diseño de las pestañas, cambia en las dos pantallas a la
vez. `Tabs` solo dibuja lo que recibe; qué pestañas existen y cuál se muestra lo
deciden `ProfileTabs` y `AdminPage`.

El panel vivía en `/admin/users` cuando solo gestionaba cuentas; esa URL sigue
funcionando porque redirige a `/admin`.

## Convenciones

- Todo en TypeScript: no se crean archivos `.js` / `.jsx`.
- Componentes funcionales con Hooks, en PascalCase; hooks en camelCase con prefijo `use`.
- Handlers de eventos con prefijo `handle` (`handleSubmit`, `handleLogout`).
- Parciales SCSS en kebab-case con guion bajo (`_album-card.scss`) y registrados en
  `styles/main.scss`.
- Mobile-first: primero el estilo base, después `@media (min-width: ...)`.
- Sin librerías de UI, de estado ni de estilos fuera del stack definido.
