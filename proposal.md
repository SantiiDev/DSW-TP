# Propuesta TP DSW

## Grupo
### Integrantes
* 55117 - Gallo, Santino
* 54507 - Esterri, Juan Ignacio
* 55037 - Siena, Santiago

### Repositorios
* [Repositorio del proyecto (monorepo: frontend + backend)](https://github.com/SantiiDev/DSW-TP)
  * [frontend app](https://github.com/SantiiDev/DSW-TP/tree/main/frontend)
  * [backend app](https://github.com/SantiiDev/DSW-TP/tree/main/backend)

## Tema
### Descripción
Musicboxd es una plataforma social y catálogo musical interactivo donde los usuarios pueden registrar, calificar con estrellas y reseñar los álbumes o canciones de esos álbumes que escuchan. Contiene descubrimiento mediante un feed comunitario y rankings de los discos mejor valorados. Su modelo de negocio se basa en membresías escalables (Free, Pro y Patron), ofreciendo a los usuarios premium una experiencia sin anuncios, estadísticas detalladas y opciones de personalización avanzadas.

### Origen de los datos del catálogo
La base de datos propia del sistema es la **única fuente de verdad en tiempo de ejecución**: la aplicación no consulta APIs externas de música durante su funcionamiento normal. Ningún endpoint de la API ni ningún componente del frontend le pega a un servicio de metadata musical.

El catálogo inicial (géneros, artistas, álbumes y canciones) se carga mediante un **procedimiento de seed** partido en dos etapas bien separadas:

1. **Descarga (`npm run seed:fetch`)**: única etapa que sale a internet. Se ejecuta **una sola vez, de forma manual**, y guarda la metadata descargada en `backend/src/seed/data/*.json`. Esos archivos están **versionados en el repositorio**.
2. **Carga (`npm run seed`)**: lee esos JSON e inserta en las tablas propias. **No requiere conexión a internet** y es idempotente: se puede correr las veces que haga falta sin duplicar registros.

Esta separación es lo que hace que el procedimiento sea reproducible: la carga da siempre el mismo resultado y sigue funcionando aunque el servicio externo esté caído o cambie su API.

**Servicio elegido: Deezer.** Los motivos:

* Sus endpoints son **públicos y no requieren autenticación**, a diferencia de Spotify, que exige el flujo OAuth de Client Credentials.
* Expone los **géneros a nivel álbum**, que es exactamente como los modela nuestro DER (relación N:M entre `GENRES` y `ALBUMS`). Spotify solo los tiene a nivel artista, con lo cual habría que derivarlos.
* Devuelve **álbum, artista, tracklist, géneros y portada en pocas llamadas**.
* Sus términos de uso no restringen la persistencia del catálogo, a diferencia de los Términos de Desarrollador de Spotify.

Alcance efectivamente cargado por el seed: **11 géneros, 88 artistas, 263 álbumes y 3.618 canciones**, además de los 3 planes de membresía y un usuario administrador inicial. La selección de artistas es una curaduría propia (archivo `backend/src/seed/catalog-selection.ts`) e incluye un género propio, **Rock Nacional**, con 17 artistas argentinos.

Para no desviarse del pasaje a tablas, **no se agregó ninguna columna al modelo para el id externo**: la idempotencia del seed se resuelve identificando cada registro por su clave natural (el género por su nombre, el álbum por título + artista, la canción por su número de pista dentro del álbum).

El detalle del procedimiento, la comparación con Spotify y las limitaciones conocidas de los datos están documentados en el [README del backend](https://github.com/SantiiDev/DSW-TP/tree/main/backend#catálogo-inicial).

A partir de ahí, el catálogo crece **desde dentro del sistema**: los usuarios con membresía **Patron** pueden dar de alta nuevos artistas, álbumes y canciones, que quedan en estado pendiente hasta que un administrador los aprueba. De este modo los CRUD de catálogo son operaciones reales sobre tablas propias y siguen siendo casos de uso con valor para el negocio.

### Modelo
<img width="1160" height="702" alt="der-dsw drawio" src="https://github.com/user-attachments/assets/231ba2aa-5e9c-4692-9eb7-c75030129906" />
https://drive.google.com/drive/folders/1popRH9AojPdvK1NS7iWrenMltxDe6gXC

Ajustes sobre el DER original:
* `USERS.rol` se define como `FREE | PRO | PATRON | ADMIN`, cubriendo los niveles de acceso del sistema.
* `ARTIST`, `ALBUMS` y `SONGS` incorporan los atributos `state` (`pending | approved | rejected`) y `created_by`, necesarios para el circuito de aporte de catálogo por parte de usuarios Patron y su moderación por parte de un administrador.
* `SUBSCRIPTION` incorpora los atributos `end_date` y `state` (`active | expired | cancelled`), que permiten determinar la membresía vigente de un usuario y distinguir una baja voluntaria de un vencimiento.
* `ALBUMS.average_rating` es un atributo derivado, recalculado al crear, modificar o eliminar una reseña.
* `REVIEW` incorpora una restricción de unicidad por usuario e ítem: un usuario publica a lo sumo una reseña por álbum y una por canción, con posibilidad de modificarla o eliminarla.

## Alcance Funcional

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género|
|CRUD dependiente|1. CRUD Álbum {depende de} CRUD Artista y CRUD Género<br>2. CRUD Reseña {depende de} CRUD Usuario y CRUD Álbum|
|Listado<br>+<br>detalle| 1. Listado de álbumes filtrado por género y/o año → detalle muestra datos del álbum, tracklist de canciones (cada una con su propia calificación promedio) y reseñas paginadas del álbum.<br> 2. Listado de reseñas en el perfil público de un usuario, filtrado por calificación (estrellas) => detalle de la reseña y link al álbum asociado.|
|CUU/Epic|1. Publicar y gestionar una reseña con calificación para un álbum o una canción específica<br>2. Realizar el upgrade de cuenta a plan PRO/PATRON mediante pasarela de pago.|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género<br>4. CRUD Álbum<br>5. CRUD Reseña<br>6. CRUD Canción<br>7. CRUD Plan de membresía|
|CUU/Epic|1. **Sistema de Reseñas**: publicar y gestionar calificación y reseña tanto de álbumes como de canciones individuales.<br>2. **Pasarela de Pagos y Membresías**: integración con API de pagos (MercadoPago). Gestión de webhooks para actualizar el plan del usuario a PRO o PATRON automáticamente. Esto elimina los anuncios en el frontend, habilita la personalización de perfil y desbloquea las estadísticas.<br>3. **Aporte y moderación de catálogo**: un usuario con membresía PATRON puede dar de alta artistas, álbumes y canciones, que ingresan en estado `pending`; un usuario ADMIN los revisa y aprueba o rechaza, momento en el cual pasan a ser visibles y reseñables por toda la comunidad.<br>4. **Feed Social y Estadísticas Avanzadas**: generación de timeline global y cálculo de estadísticas analíticas (ej. "Tu año en música", "Géneros más escuchados"). Nota: las estadísticas están bloqueadas para usuarios FREE.|

**Relación entre los casos de uso** (requisito de que la data de un CUU sirva de input a otro):

```
CUU 2 (pago)  →  el usuario pasa a ser PATRON
      →  habilita CUU 3 (aportar catálogo)  →  se crea y aprueba un álbum
            →  habilita CUU 1 (reseñar ese álbum)
                  →  alimenta CUU 4 (feed y estadísticas)
```


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Ranking global de usuarios más activos. <br>2. Panel de Administración (Dashboard Admin) con métricas de ingresos por membresías y cantidad de usuarios por plan.|
|CUU/Epic|1. Listas personalizadas: Creación y gestión de agrupaciones de álbumes públicas (ej. "Favoritos del Rock Nacional").|
|Otros|1. Autocompletado de metadatos al dar de alta un álbum desde el circuito de aporte Patron, reutilizando la data ya descargada por el procedimiento de seed.|

## Stack tecnológico

|Capa|Tecnología|
|:-|:-|
|Frontend|Vite + React + TypeScript, React Router, Context API + useReducer, SASS (arquitectura 7-1)|
|Backend|Node.js + Express + TypeScript, arquitectura en capas (routes → controller → service → repository)|
|Persistencia|MySQL gestionado en Aiven (servicio cloud externo), ORM Sequelize v6|
|Validación|Zod|
|Autenticación|JWT propio + bcrypt, con 4 niveles de acceso (FREE, PRO, PATRON, ADMIN)|
|Pagos|MercadoPago Checkout Pro (sandbox) con webhook de confirmación|
|Testing|Vitest + React Testing Library (frontend), Vitest + Supertest (backend), Playwright (E2E)|
