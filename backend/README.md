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

### 5. Cargar los planes de membresía

```bash
npm run seed:plans
```

Es idempotente: se puede correr las veces que haga falta.

## Scripts

| Script | Qué hace |
|:-|:-|
| `npm run dev` | Levanta la API en modo desarrollo, con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (producción) |
| `npm run typecheck` | Verifica tipos sin generar archivos |
| `npm run seed:plans` | Carga los planes Free / Pro / Patron |

## Estructura del proyecto

```
src/
  entities/          Modelos de Sequelize (una por tabla del DER) +
                     index.ts con TODAS las asociaciones
  shared/
    config/env.ts    Lectura y validación de variables de entorno
    db/sequelize.ts  Instancia única de conexión
    errors/          Clases de error de negocio (AppError y derivadas)
    middlewares/     validate, error-handler, not-found
    types/enums.ts   Enumerados del dominio (roles, estados)
  types/             Declaraciones de tipos globales (extensión de Request)
  health/            Endpoint de health check (ejemplo del patrón de capas)
  seed/              Scripts de carga inicial de datos
  routes.ts          Router principal: monta el router de cada feature
  app.ts             Configuración de Express (sin levantar el servidor)
  server.ts          Punto de entrada: conecta a la DB y escucha
```

## Arquitectura en capas

Cada feature se organiza en cinco archivos con una responsabilidad cada uno:

```
src/album/
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
import { Album } from '../entities';
import { CreateAlbumInput } from './album.schema';

export const albumRepository = {
  findAll: () => Album.findAll(),
  findById: (id: number) => Album.findByPk(id),
  create: (data: CreateAlbumInput) => Album.create(data),
};
```

```ts
// album.service.ts
import { NotFoundError } from '../shared/errors/app-error';
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
import { validate } from '../shared/middlewares/validate';
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
  `approved`, lo que aporta un usuario PATRON entra como `pending` hasta que un
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
