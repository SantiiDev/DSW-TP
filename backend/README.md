# Musicboxd — Backend

API REST de Musicboxd. TP de Desarrollo de Software, UTN FRRo.

## Stack

| | |
|:-|:-|
| Runtime | Node.js + TypeScript |
| Framework web | Express 5 |
| ORM | Sequelize 6 (tipado nativo con `InferAttributes`) |
| Base de datos | MySQL 8 (local en desarrollo, servicio cloud en producción) |
| Validación | Zod |

## Puesta en marcha

### 1. Requisitos

- Node.js 20 o superior
- Un servidor MySQL 8 accesible (en desarrollo, MySQL local)

### 2. Crear la base y el usuario de la aplicación

El ORM crea las tablas, pero no la base. Conectarse al MySQL local **como root**
(por consola o con MySQL Workbench) y ejecutar una sola vez, cambiando
`CAMBIAME` por una contraseña de desarrollo:

```sql
CREATE DATABASE IF NOT EXISTS musicboxd
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'musicboxd_app'@'localhost' IDENTIFIED BY 'CAMBIAME';
CREATE USER IF NOT EXISTS 'musicboxd_app'@'127.0.0.1' IDENTIFIED BY 'CAMBIAME';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES
  ON musicboxd.* TO 'musicboxd_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES
  ON musicboxd.* TO 'musicboxd_app'@'127.0.0.1';

FLUSH PRIVILEGES;
```

El backend se conecta con `musicboxd_app` y no con root: ese usuario solo tiene
permisos sobre el esquema `musicboxd`, así que ningún error de la aplicación puede
afectar al resto del servidor. Necesita `CREATE`, `ALTER`, `DROP` e `INDEX` porque
Sequelize crea y ajusta las tablas cuando `DB_SYNC=true`.

> **Si tenés XAMPP instalado**, su MariaDB ocupa el puerto 3306 y el servicio de
> MySQL 8 suele quedar deshabilitado durante la instalación. Para que convivan:
> cambiar `port=3306` por `port=3307` en las dos líneas donde aparece dentro de
> `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`, habilitar el servicio con
> `Set-Service MySQL80 -StartupType Manual` y arrancarlo con `net start MySQL80`
> (ambos comandos requieren una terminal de administrador). XAMPP se queda en el
> 3306 y MySQL 8 pasa al 3307.
>
> Verificar contra cuál de los dos estás trabajando:
> ```sql
> SELECT VERSION(), @@port;
> ```
> Tiene que decir `8.x`, no `10.x-MariaDB`.

### 3. Configurar el entorno

```bash
cp .env.example .env
```

Completar `DB_PORT` (3306 o 3307 según lo anterior) y `DB_PASSWORD` con la
contraseña que elegiste para `musicboxd_app`. Las demás variables ya vienen con
valores válidos para desarrollo.

### 4. Instalar y levantar

```bash
npm install
npm run dev
```

La API queda en `http://localhost:3000/api`. Para verificar que todo está bien:

```bash
curl http://localhost:3000/api/health
```

Debe responder `{"status":"ok","database":"up",...}`.

Con `DB_SYNC=true` (el valor por defecto en desarrollo), Sequelize crea y ajusta
las tablas automáticamente al arrancar a partir de las entidades.

### 5. Cargar los datos iniciales

```bash
npm run seed
```

Un solo comando deja la base usable: los 2 planes de membresía, el catálogo completo
(11 géneros, 88 artistas, 263 álbumes y 3.618 canciones) y el usuario administrador.

**No necesita conexión a internet.** El catálogo se lee de archivos JSON versionados
en el repositorio, no de una API externa. Ver [Catálogo inicial](#catálogo-inicial).

Tarda alrededor de un minuto y termina con un resumen de lo insertado:

```
[seed] Géneros: 11 nuevos, 0 ya existentes.
[seed] Artistas: 88 nuevos, 0 ya existentes.
[seed] Álbumes: 263 nuevos, 0 ya existentes.
[seed] Canciones: 3618 nuevas.
[seed] Vínculos género-álbum: 405 nuevos.
[seed] Usuario ADMIN creado: admin@musicboxd.com (usuario: admin)
```

Todos los seeds son **idempotentes**: se pueden correr las veces que haga falta sin
duplicar registros. Al correrlo una segunda vez, todos los contadores dan cero.

Las credenciales del administrador salen de `SEED_ADMIN_*` en el `.env`. Por defecto:

| Usuario | Email | Contraseña |
|:-|:-|:-|
| `admin` | `admin@musicboxd.com` | `Admin1234!` |

## Scripts

| Script | Qué hace |
|:-|:-|
| `npm run dev` | Levanta la API en modo desarrollo, con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (producción) |
| `npm run typecheck` | Verifica tipos sin generar archivos |
| `npm run seed` | Corre todos los seeds del proyecto |
| `npm run seed:plans` | Corre solo el seed de planes Free / Pro |
| `npm run seed:catalog` | Corre solo el seed del catálogo |
| `npm run seed:admin` | Corre solo el seed del usuario administrador |
| `npm run seed:fetch` | **Descarga el catálogo de Deezer.** Es el único script que sale a internet, y no hace falta correrlo para levantar el proyecto |
| `npm run db:reset` | Borra la base local, la recrea y corre todos los seeds |
| `npm run db:fix-indexes` | Limpia índices duplicados que puede dejar `sync({ alter: true })` |
| `npm run db:migrate:patron` | Migración puntual: pasa a `PRO` los usuarios `PATRON` y borra ese plan. Solo hace falta en bases creadas antes de que se eliminara ese nivel |

## Reiniciar la base local

Con `DB_SYNC=true`, Sequelize actualiza el esquema solo al arrancar: si un compañero
agrega una columna a una entidad, alcanza con hacer `git pull` y `npm run dev`.

Pero `sync({ alter: true })` es bueno agregando y flojo renombrando o eliminando, y
si se corre muchas veces puede acumular índices duplicados. Cuando la base local
quede rara después de varios cambios de modelo, en vez de pelearla se rehace:

```bash
npm run db:reset
```

Borra todas las tablas (incluidas las huérfanas de entidades renombradas), recrea el
esquema desde las entidades y vuelve a correr los seeds. **La base local es
descartable**: todos sus datos vienen de los seeds, así que no se pierde nada. En
ningún momento del proyecto debería haber información importante que exista solo en
la máquina de un integrante.

El script se niega a correr si `NODE_ENV=production`, y antes de borrar imprime a qué
host, puerto y base se está conectando.

### Bases creadas antes de que se eliminara el nivel PATRON

El sistema tenía cuatro niveles de acceso (`FREE | PRO | PATRON | ADMIN`) y pasó a
tener tres: lo que era exclusivo de Patron —aportar al catálogo— ahora entra en Pro.

Una base creada antes de ese cambio todavía guarda el rol `PATRON` y el plan del
mismo nombre, y eso rompe el arranque: con `DB_SYNC=true` Sequelize achica el ENUM
de `users.rol` y falla si quedan filas con un valor que ya no existe. Antes de
levantar el backend hay que limpiarla:

```bash
npm run db:migrate:patron
```

Pasa a `PRO` los usuarios que eran `PATRON`, reapunta sus suscripciones al plan Pro
y borra el plan Patron. Es idempotente: sobre una base ya migrada no hace nada.
Si la base local es descartable, `npm run db:reset` logra lo mismo desde cero.

## Catálogo inicial

### La base propia es la única fuente de verdad

Musicboxd **no consulta APIs externas de música en runtime**. Ningún endpoint de la
API ni ningún componente del frontend le pega a Deezer, Spotify ni MusicBrainz: todo
sale de las tablas propias. La metadata musical se descarga **una sola vez, offline**,
y a partir de ahí el catálogo crece desde adentro del sistema, con los aportes de los
usuarios PRO que un ADMIN modera.

Esto tiene una consecuencia importante para el TP: los CRUD de Artista, Álbum, Género
y Canción son CRUD reales sobre tablas propias, no un proxy contra un servicio ajeno.

### Las dos etapas, y por qué están separadas

```
   [ Deezer ]                          (1 vez, a mano, con internet)
       │
       │  npm run seed:fetch
       ▼
 src/seed/data/*.json                  (versionado en git)
       │
       │  npm run seed
       ▼
   [ MySQL ]                           (sin internet, reproducible)
       │
       │  la app solo lee de acá
       ▼
   [ API REST ]
```

`seed:fetch` es lo único que sale a internet, y **no hace falta correrlo**: los tres
archivos que genera están commiteados. Solo se vuelve a ejecutar si se quiere ampliar
la selección de `src/seed/catalog-selection.ts`.

Separarlo así es lo que hace que el seed sea reproducible: `npm run seed` carga
siempre exactamente los mismos datos, funciona sin conexión y sigue funcionando aunque
Deezer esté caído o cambie su API.

| Archivo | Contenido |
|:-|:-|
| `src/seed/catalog-selection.ts` | La curaduría: qué géneros y qué artistas se descargan |
| `src/seed/deezer-client.ts` | Cliente HTTP de Deezer (rate limit y reintentos) |
| `src/seed/fetch-metadata.ts` | Etapa 1: descarga y escribe los JSON |
| `src/seed/data/*.json` | La metadata descargada, versionada en git |
| `src/seed/seed-catalog.ts` | Etapa 2: inserta los JSON en la base |

### Por qué Deezer y no Spotify

| | Deezer | Spotify |
|:-|:-|:-|
| Autenticación | Ninguna, endpoints públicos | OAuth (Client Credentials) |
| Géneros | A nivel **álbum** | Solo a nivel artista |
| Tracklist | Viene en el detalle del álbum | Requiere llamadas aparte |
| Términos de uso | Sin restricción para persistir catálogo | Sus Términos de Desarrollador restringen almacenar el catálogo |

El modelo del TP asocia los géneros al **álbum** (tabla `genres_albums`), que es
justamente como los expone Deezer. Con Spotify habría que derivarlos del artista.

### Cómo se eligen los datos

Se descargan 3 álbumes de cada artista, de 11 géneros. La selección de artistas está
escrita a mano en `catalog-selection.ts` en lugar de tomarse de la API por dos motivos:

1. El endpoint `/genre/{id}/artists` de Deezer devuelve un ranking general de
   popularidad, no una clasificación por género: pedirle los artistas de "Rock"
   contesta BTS y Bad Bunny.
2. Permite incluir un género propio, **Rock Nacional**, con 17 artistas argentinos que
   ningún chart de Deezer prioriza.

Dos detalles del script que vale la pena conocer:

- **Elección de la página de artista.** Deezer tiene páginas duplicadas para casi todos
  los artistas conocidos, con el mismo nombre y un puñado de singles, y el buscador las
  devuelve primero. Entre las coincidencias exactas se elige la de más seguidores: la
  página real de Charly García tiene 198.798 y la que devuelve primero el buscador, 6.
  Para los nombres genuinamente ambiguos (Virus, la banda argentina, contra Vîrus, el
  rapero francés, que sin acentos se escriben igual) la curaduría permite fijar el id.
- **Número de pista.** El detalle del álbum de Deezer no trae `track_position`, pero
  devuelve las canciones en el orden del disco, así que `number_track` sale de esa
  posición. Numerarlas corrido resuelve además los álbumes dobles: copiar la numeración
  por disco daría dos pistas nº 1 en el mismo álbum y violaría el índice único
  `uq_song_album_track`.

### Limitaciones conocidas de los datos

- **El año es el de la edición, no siempre el del lanzamiento original.** Deezer no
  expone la fecha original de un disco, sino la de cada edición que tiene cargada. De
  cada grupo de reediciones el script se queda con la fecha más antigua, que corrige 26
  de los 263 álbumes; en el resto Deezer directamente no tiene cargada la edición
  original y el año queda siendo el de la reedición (Clics Modernos, de 1983, figura
  como 2007).
- **Los artistas no tienen biografía.** La API pública de Deezer no la expone. La
  columna queda en `NULL` y se completa desde el CRUD de artista.
- **Algunos títulos conservan el sufijo de la edición** ("Master Of Puppets
  (Remastered)"). Se guardan tal como los devuelve Deezer, sin retocarlos.

### Idempotencia sin tocar el DER

Las tablas no guardan el id de Deezer: agregar una columna `deezer_id` al modelo solo
para el seed habría sido un desvío del pasaje a tablas. En su lugar cada registro se
identifica por su **clave natural** — el género por `name`, el artista por `name`, el
álbum por `title` + artista, y la canción por su número de pista dentro del álbum, que
es la clave única que la entidad ya declaraba.

## Estructura del proyecto

```
src/
  server.ts          Punto de entrada: conecta a la DB y escucha
  app.ts             Configuración de Express (sin levantar el servidor)
  routes.ts          Router principal: monta el router de cada feature

  features/          EL DOMINIO: una carpeta por entidad, con sus cinco capas
    health/          Health check (además, ejemplo del patrón de capas)
    auth/            Registro, inicio de sesión y usuario logueado
    user/            CRUD de usuarios y cambio de rol

  entities/          Modelos de Sequelize (uno por tabla del DER) +
                     index.ts con TODAS las asociaciones

  shared/            LO TRANSVERSAL: lo que usan varias features
    auth/jwt.ts      Firma y verificación de los tokens
    config/env.ts    Lectura y validación de variables de entorno
    db/sequelize.ts  Instancia única de conexión
    errors/          Clases de error de negocio (AppError y derivadas)
    middlewares/     validate, require-auth, require-role, error-handler, not-found
    types/           Enumerados del dominio + extensión global de Request

  seed/              Carga inicial de datos + data/*.json descargados
  scripts/           Mantenimiento de la base (reset, índices, migraciones)
```

La organización es la misma que la del frontend: **`features/` es el dominio y
`shared/` es lo transversal** (el equivalente de `core/` del lado del cliente). Con
esa separación, `src/` no crece: sumar el CRUD de álbum agrega una carpeta adentro
de `features/`, no una más en la raíz.

### Por qué `entities/` está afuera de las features

Es la única parte que no espeja al frontend, y es a propósito. En el frontend cada
feature tiene su `models/` porque esas clases son independientes entre sí. Acá las
entidades son un grafo conectado: `entities/index.ts` declara **todas** las
asociaciones en un solo lugar, justamente para evitar imports circulares.

Si cada entidad viviera dentro de su feature, `review` importaría de `album`, `song`
y `user`, y `album` de `artist` y `genre`: círculos de imports y el mapa de
relaciones repartido en diez archivos. Centralizarlas es una restricción del ORM,
no un descuido.

### `seed/` y `scripts/`: qué va en cada una

| Carpeta | Qué contiene | Cuándo se corre |
|:-|:-|:-|
| `seed/` | Todo lo que **carga datos iniciales**: los cargadores (`run-seeds`, `seed-*.ts`), los JSON de `data/` y el descargador de Deezer que los generó | Al preparar una base nueva |
| `scripts/` | Tareas de **mantenimiento de la base**: `reset-db`, `fix-indexes`, `migrate-patron-to-pro` | Puntualmente, cuando hace falta |

No son seeds: un `reset-db` borra tablas y una migración corrige datos existentes.
Tenerlos mezclados hacía que `seed/` pareciera un cajón de sastre.

## Arquitectura en capas

Cada feature se organiza en cinco archivos con una responsabilidad cada uno:

```
src/features/album/
  album.routes.ts       define las rutas y encadena los middlewares
  album.controller.ts   traduce HTTP <-> service. No consulta la base
  album.service.ts      lógica de negocio. No conoce req ni res
  album.repository.ts   acceso a datos vía Sequelize
  album.schema.ts       schemas de Zod para validar la entrada
```

El flujo es siempre **routes → controller → service → repository → entity**.
No se saltean capas: un controller nunca consulta el modelo directamente.

### Plantilla para una feature nueva

```ts
// album.schema.ts
import { z } from 'zod';

export const createAlbumSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio.').max(200),
  release_year: z.number().int().min(1900).max(2100).optional(),
  id_artist: z.number().int().positive(),
});
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
```

```ts
// album.repository.ts
import { Album } from '../../entities';
import { CreateAlbumInput } from './album.schema';

export const albumRepository = {
  findAll: () => Album.findAll(),
  findById: (id: number) => Album.findByPk(id),
  create: (data: CreateAlbumInput) => Album.create(data),
};
```

```ts
// album.service.ts
import { NotFoundError } from '../../shared/errors/app-error';
import { albumRepository } from './album.repository';

export const albumService = {
  async findById(id: number) {
    const album = await albumRepository.findById(id);
    if (!album) throw new NotFoundError('El álbum');
    return album;
  },
};
```

```ts
// album.controller.ts
import { Request, Response } from 'express';
import { albumService } from './album.service';

export const albumController = {
  // En Express 5 no hace falta try/catch: los errores de una promesa rechazada
  // llegan solos al middleware de manejo de errores.
  async findById(req: Request, res: Response) {
    const album = await albumService.findById(Number(req.params.id));
    res.status(200).json(album);
  },
};
```

```ts
// album.routes.ts
import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate';
import { albumController } from './album.controller';
import { createAlbumSchema } from './album.schema';

export const albumRouter = Router();

albumRouter.get('/:id', albumController.findById);
albumRouter.post('/', validate({ body: createAlbumSchema }), albumController.create);
```

Por último se monta en `src/routes.ts`:

```ts
router.use('/albums', albumRouter);
```

## Validación y manejo de errores

El middleware `validate({ body, params, query })` valida con Zod antes de llegar
al controller y deja los datos parseados en `req.validated`. Los controllers leen
de ahí, nunca de `req.body` crudo:

```ts
const data = req.validated.body as CreateAlbumInput;
```

Si algo falla, se lanza el error y lo captura el middleware central, que devuelve
siempre el mismo formato:

```json
{
  "message": "Los datos enviados no son válidos.",
  "errors": [
    { "field": "rating", "message": "La calificación máxima es 5 estrellas." }
  ]
}
```

Ese middleware traduce automáticamente: errores propios (`AppError` y derivadas),
errores de Zod, violaciones de índice único (409), violaciones de clave foránea (409)
y validaciones del modelo de Sequelize (400). Los 5xx se loguean completos en el
servidor y nunca exponen el SQL al cliente.

## Autenticación y roles

La API usa **JWT propio** (sin librerías de terceros tipo Passport) y **bcrypt**
para el hash de las contraseñas. No hay sesiones ni cookies: el token viaja en el
header `Authorization` en cada request.

### Endpoints

| Método | Ruta                 | Acceso    | Descripción                                     |
| :----- | :------------------- | :-------- | :---------------------------------------------- |
| POST   | `/api/auth/register` | público   | Crea la cuenta (siempre `FREE`) y devuelve token |
| POST   | `/api/auth/login`    | público   | Valida credenciales y devuelve token             |
| GET    | `/api/auth/me`       | logueado  | Datos del usuario dueño del token                |

`register` y `login` responden lo mismo: el usuario y su token.

```json
{
  "user": {
    "id_user": 1,
    "username": "admin",
    "email": "admin@musicboxd.com",
    "rol": "ADMIN",
    "registration_date": "2026-08-13T18:31:40.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Ejemplo con curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@musicboxd.com","password":"Admin1234!"}'
```

```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <token>"
```

### Proteger una ruta

Dos middlewares, siempre en este orden: primero `requireAuth` (¿quién sos?) y
después `requireRole` (¿te alcanza el rol?).

```ts
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';

// Cualquier usuario logueado
albumRouter.post('/:id/reviews', requireAuth, reviewController.create);

// Alta de catálogo: solo PRO o ADMIN
albumRouter.post('/', requireAuth, requireRole('PRO', 'ADMIN'), albumController.create);

// Moderación: solo ADMIN
albumRouter.patch('/:id/approve', requireAuth, requireRole('ADMIN'), albumController.approve);
```

`requireAuth` verifica el token y deja `{ id_user, rol }` en `req.user`, que el
controller usa para saber quién está haciendo la operación:

```ts
const id_user = req.user!.id_user;
```

Los códigos son los esperables: **401** si falta el token, está vencido o es
inválido; **403** si el usuario está logueado pero su rol no alcanza.

### Decisiones de esta parte

- **El rol nunca sale de la request.** Todo registro público entra como `FREE`,
  aunque el body traiga `"rol": "ADMIN"`. Se sube a `PRO` pagando, y a `ADMIN`
  solo desde el seed.
- **La contraseña no sale nunca en una respuesta.** El `defaultScope` de la entidad
  `User` la excluye de toda consulta; el login es el único lugar que usa
  `User.scope('withPassword')`, y aun ahí el service arma la respuesta campo por campo.
- **Login fallido: siempre el mismo mensaje**, exista o no el email. Distinguir los
  casos le permitiría a un atacante averiguar qué cuentas están registradas.
- **`JWT_SECRET` es obligatorio.** Si falta, el servidor no arranca: con una clave
  vacía cualquiera podría fabricarse un token de `ADMIN`.
- El frontend replica estos permisos con `ProtectedRoute`, pero eso es solo para la
  navegación: **la validación real es la del backend**.

## Membresías y pasarela de pago

El CUU de upgrade a `PRO`. Tres features trabajan juntas: `plan` (qué se vende),
`subscription` (quién lo tiene y hasta cuándo) y `payment` (cómo se cobró).

### El circuito, de punta a punta

```
1. El usuario aprieta "Pasarme a Pro"
   -> POST /api/payments/checkout  crea la preference en MercadoPago
                                   y devuelve el link. NO guarda nada todavía.
2. Paga en MercadoPago.
3. MercadoPago avisa, por DOS caminos que terminan en la misma función:
     - POST /api/payments/webhook   aviso servidor a servidor (URL pública)
     - POST /api/payments/confirm   lo llama la pantalla /pro/return del frontend
4. confirmPayment() le PREGUNTA a MercadoPago cómo terminó el pago y, si está
   aprobado, en UNA transacción:
     cancela la suscripción anterior -> crea la nueva por un mes
     -> sube users.rol a 'PRO' -> registra el pago
5. El frontend pide POST /api/auth/refresh para tener un token con el rol nuevo.
```

### Las cuatro decisiones que hay que poder explicar

- **Nunca se le cree a quien avisa.** Ni el webhook ni la pantalla de retorno
  dicen si un pago se aprobó: solo dicen qué id mirar. El estado se consulta
  contra MercadoPago con nuestro access token. Si no fuera así, cualquiera se
  haría `PRO` mandando un POST inventado al webhook, que es una ruta pública.
- **El circuito es idempotente.** Los dos avisos pueden llegar, en cualquier
  orden. Antes de activar nada se busca el pago por su `id_gateway`; y si dos
  entraran a la vez, el índice único `payments_id_gateway_unique` haría fallar al
  segundo. La membresía no se puede duplicar.
- **El webhook siempre responde 200, incluso cuando falla.** MercadoPago
  reintenta durante días todo lo que no sea 2xx, así que un error se registra en
  el log del servidor y se le contesta 200 igual. Es la única ruta del sistema
  con `try/catch` y sin `validate()`.
- **Solo se persiste el pago aprobado.** `payments.id_subscription` es NOT NULL y
  `subscription.state` no tiene un valor `pending`, así que un pago rechazado
  obligaría a crear una suscripción que nunca estuvo vigente. Un rechazo no deja
  fila: el usuario lo ve en la pantalla de retorno y puede reintentar.

### Renovación manual, no débito automático

La membresía dura **un mes** (`subscription.end_date`) y **no se renueva sola**.
Se usa Checkout Pro, que es para pagos únicos; el cobro recurrente en MercadoPago
es otro producto (`preapproval`) y habría que guardar el id de la suscripción
externa, columna que el DER no tiene. Sin ese dato, dar de baja cancelaría la
membresía en nuestra base mientras MercadoPago le sigue cobrando al usuario.

El vencimiento se aplica de forma **perezosa**: cada lectura de la membresía
(`subscriptionService.getActive`) chequea si venció, y si venció la pasa a
`expired` y baja el rol a `FREE`. No hace falta ningún proceso corriendo en el
tiempo.

### El rol vive dentro del token

`requireRole` lee el rol del JWT, no de la base. Entonces, después de pagar, el
token guardado sigue diciendo `FREE` y el backend rechazaría las rutas que el
usuario acaba de comprar. Por eso existe `POST /api/auth/refresh`: relee el
usuario y emite un token nuevo. El frontend lo llama al confirmar un pago y al
dar de baja una membresía.

### Endpoints

| Método | Ruta | Acceso |
|:-|:-|:-|
| GET | `/api/plans` | público |
| GET | `/api/plans/:id` | público |
| POST · PATCH · DELETE | `/api/plans` · `/api/plans/:id` | ADMIN |
| GET | `/api/subscriptions/mine` | logueado |
| PATCH | `/api/subscriptions/mine/cancel` | logueado |
| GET | `/api/subscriptions` | ADMIN |
| POST | `/api/payments/checkout` | logueado |
| POST | `/api/payments/confirm` | logueado |
| POST | `/api/payments/webhook` | **público** (lo llama MercadoPago) |
| GET | `/api/payments/mine` | logueado |

### Configurar MercadoPago para probarlo

1. En [Tus integraciones](https://www.mercadopago.com.ar/developers/panel), crear
   una aplicación de tipo **Checkout Pro** y copiar su access token a
   `MERCADOPAGO_ACCESS_TOKEN`.
2. Crear **dos usuarios de prueba**: uno vendedor (dueño de la aplicación) y uno
   comprador. MercadoPago no deja comprarse a uno mismo.
3. `MERCADOPAGO_NOTIFICATION_URL` se deja **vacía** en desarrollo: a `localhost`
   no le llega ningún webhook, y la confirmación la resuelve la pantalla de
   retorno. Para probar el webhook de verdad hay que exponer el backend (por
   ejemplo con ngrok) y poner ahí `https://<host>/api/payments/webhook`.

`auto_return` solo se le manda a MercadoPago si la URL de retorno es pública:
con un `localhost` rechaza la preference entera.

## Modelo de datos

Diez tablas, según el pasaje a tablas del DER:

`users`, `plan`, `subscription`, `payments`, `artist`, `albums`, `genres`,
`genres_albums`, `song`, `review`.

### Desvíos respecto del pasaje a tablas original

| Tabla | Cambio | Motivo |
|:-|:-|:-|
| `subscription` | Se agrega PK subrogada `id_subscription`; la clave natural `(id_user, id_plan, subscription_date)` queda como índice UNIQUE | Sequelize 6 no soporta claves foráneas compuestas en asociaciones, y `payments` referencia a esta tabla |
| `payments` | La FK compuesta a `subscription` se reemplaza por `id_subscription` | Consecuencia del punto anterior |
| `subscription` | Se agregan las columnas `end_date` (NULL) y `state` (`active / expired / cancelled`) | Con solo la fecha de alta no había forma de saber si una membresía sigue vigente, ni de distinguir una baja de un vencimiento: un usuario que pagó una vez sería PRO para siempre |
| `song` | Se agrega PK subrogada `id_song`; `(id_album, number_track)` queda como índice UNIQUE | `number_track` es el número de pista dentro del álbum: se repite entre álbumes y no identifica una canción por sí solo |
| `review` | La FK `number_track` pasa a llamarse `id_song` | Consecuencia del punto anterior |
| `genres` | La PK es `id_genre` | El pasaje a tablas decía `id_album`, error de tipeo |

En los tres casos la regla de unicidad del modelo original se conserva mediante un
índice UNIQUE: no se perdió ninguna restricción, solo cambió qué columna es la PK.

### Reglas de negocio en el modelo

- Una reseña apunta a un álbum **o** a una canción, nunca a ambos ni a ninguno.
- Un usuario reseña **una sola vez** cada álbum y cada canción. Puede editar o borrar
  esa reseña, y si la borra puede volver a reseñar el ítem; lo que no puede es tener
  dos reseñas publicadas del mismo álbum.
- `rating` va de 0.5 a 5.0, en pasos de media estrella (`DECIMAL(2,1)`).
- Una suscripción tiene `state` y `end_date`. Que haya **una sola** suscripción
  `active` por usuario no se puede garantizar con un índice UNIQUE (MySQL no admite
  índices únicos parciales): esa regla la aplica el service de membresías, que al
  activar una nueva pasa la anterior a `cancelled` dentro de la misma transacción.
- `average_rating` de un álbum es un atributo derivado: se recalcula al crear,
  editar o borrar una reseña.
- El contenido de catálogo (`artist`, `albums`, `song`) tiene `state`
  (`pending | approved | rejected`) y `created_by`: lo que carga el seed entra como
  `approved`, lo que aporta un usuario PRO entra como `pending` hasta que un
  ADMIN lo aprueba.
- La contraseña del usuario nunca sale en una consulta: el `defaultScope` de `User`
  la excluye. Para el login se usa explícitamente `User.scope('withPassword')`.

## Pasaje a producción

El único cambio necesario para migrar de MySQL local al servicio cloud es el `.env`:

```
DB_HOST=<host del proveedor>
DB_PORT=<puerto del proveedor>
DB_SSL=true
DB_SSL_CA=<contenido del certificado CA que provee el servicio>
DB_SYNC=false
NODE_ENV=production
```

El código no cambia: `sequelize.ts` ya activa el bloque de SSL cuando `DB_SSL=true`.
