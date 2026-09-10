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
  * [documentación del TP](https://github.com/SantiiDev/DSW-TP/tree/main/docs)

Los pull requests del desarrollo están listados en la sección
[Pull requests](#pull-requests), al final de este documento.

## Tema
### Descripción
Musicboxd es una plataforma social y catálogo musical interactivo donde los usuarios pueden registrar, calificar con estrellas y reseñar los álbumes o canciones de esos álbumes que escuchan. Contiene descubrimiento mediante un feed comunitario y rankings de los discos mejor valorados. Su modelo de negocio se basa en dos niveles de membresía (Free y Pro), ofreciendo a los usuarios Pro una experiencia sin anuncios, estadísticas detalladas, opciones de personalización avanzadas y la posibilidad de aportar contenido al catálogo.

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

Alcance efectivamente cargado por el seed: **11 géneros, 88 artistas, 263 álbumes y 3.618 canciones**, además de los 2 planes de membresía y un usuario administrador inicial. La selección de artistas es una curaduría propia (archivo `backend/src/seed/catalog-selection.ts`) e incluye un género propio, **Rock Nacional**, con 17 artistas argentinos.

Para no desviarse del pasaje a tablas, **no se agregó ninguna columna al modelo para el id externo**: la idempotencia del seed se resuelve identificando cada registro por su clave natural (el género por su nombre, el álbum por título + artista, la canción por su número de pista dentro del álbum).

El detalle del procedimiento, la comparación con Spotify y las limitaciones conocidas de los datos están documentados en el [README del backend](https://github.com/SantiiDev/DSW-TP/tree/main/backend#catálogo-inicial).

A partir de ahí, el catálogo crece **desde dentro del sistema**: los usuarios con membresía **Pro** pueden dar de alta nuevos artistas, álbumes y canciones, que quedan en estado pendiente hasta que un administrador los aprueba. De este modo los CRUD de catálogo son operaciones reales sobre tablas propias y siguen siendo casos de uso con valor para el negocio.

### Modelo
<img width="1168" height="681" alt="MUSICBOXD_DER" src="https://github.com/user-attachments/assets/ab00d957-3334-4eb3-84e5-903ef95bb7ad" />
https://drive.google.com/drive/folders/1popRH9AojPdvK1NS7iWrenMltxDe6gXC

> La imagen de arriba es el DER **aprobado con la propuesta**. El modelo tal como está implementado hoy, con los ajustes que se detallan a continuación ya incorporados, está en [`docs/der.md`](docs/der.md): es el mismo diagrama en Mermaid, versionado junto al código para que no se desincronice.

Ajustes sobre el DER original:
* `USERS.rol` se define como `FREE | PRO | ADMIN`, cubriendo los niveles de acceso del sistema.
* `ARTIST`, `ALBUMS` y `SONGS` incorporan los atributos `state` (`pending | approved | rejected`) y `created_by`, necesarios para el circuito de aporte de catálogo por parte de usuarios Pro y su moderación por parte de un administrador.
* `SUBSCRIPTION` incorpora los atributos `end_date` y `state` (`active | expired | cancelled`), que permiten determinar la membresía vigente de un usuario y distinguir una baja voluntaria de un vencimiento.
* `ALBUMS.average_rating` es un atributo derivado, recalculado al crear, modificar o eliminar una reseña.
* `REVIEW` incorpora una restricción de unicidad por usuario e ítem: un usuario publica a lo sumo una reseña por álbum y una por canción, con posibilidad de modificarla o eliminarla.
* `REVIEW` incorpora el atributo `edited_date`, nulo mientras la reseña no se haya modificado desde su publicación. Permite advertir en la interfaz que el contenido fue editado con posterioridad. Se modela como atributo propio y no mediante las columnas de auditoría del ORM porque el proyecto las tiene deshabilitadas: las fechas persistidas son únicamente las previstas en el DER. Las acciones de moderación no lo modifican, ya que no alteran el contenido escrito por el autor.
* Se agrega la relación N:M **`REVIEW_LIKES`** entre `USERS` y `REVIEW`, para el "me gusta" sobre una reseña ajena. No se modeló como un contador dentro de `REVIEW` porque un contador no registra *quién* reaccionó, y sin ese dato no se puede impedir que un mismo usuario sume varios "me gusta", ni mostrar el estado del botón, ni permitir retirarlo. Al ser una relación N:M, en el pasaje a tablas se materializa como tabla intermedia con clave primaria compuesta `(id_user, id_review)`, con el mismo tratamiento que `GENRES_ALBUMS`.
* Se agrega la entidad débil **`REVIEW_COMMENTS`**, dependiente de `REVIEW`, para los comentarios sobre una reseña. A diferencia del "me gusta", el comentario tiene atributos propios (`text_comment`, `comment_date`) además de su autor, por lo que constituye una entidad y no una relación. Su existencia depende de la reseña comentada: al eliminarse la reseña se eliminan sus comentarios en cascada. Se le asigna la clave subrogada `id_comment`, con el mismo criterio aplicado en `SONG`, dado que un mismo usuario puede comentar varias veces la misma reseña y por lo tanto `(id_review, id_user)` no identifica unívocamente una fila.
* Se agrega la relación N:M **`FOLLOWS`** de `USERS` consigo misma, para el seguimiento entre usuarios que alimenta el feed social del CUU 4. Es la única relación **recursiva** del modelo: los dos extremos son la misma entidad, y por eso cada uno lleva su propio rol —`id_follower`, quién sigue, e `id_followed`, a quién sigue—. El seguimiento es **unidireccional** y no requiere que la otra parte lo acepte (mismo criterio que Letterboxd), por lo que la relación no lleva ningún atributo de estado: la fila existe o no existe. En el pasaje a tablas se materializa como tabla intermedia con clave primaria compuesta `(id_follower, id_followed)` —que es además lo que impide seguir dos veces a la misma persona— y el atributo propio `follow_date`, con el mismo tratamiento que `REVIEW_LIKES` y `GENRES_ALBUMS`.

## Alcance Funcional

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género|
|CRUD dependiente|1. CRUD Álbum {depende de} CRUD Artista y CRUD Género<br>2. CRUD Reseña {depende de} CRUD Usuario y CRUD Álbum|
|Listado<br>+<br>detalle| 1. Listado de álbumes filtrado por género y/o año → detalle muestra datos del álbum, tracklist de canciones (cada una con su propia calificación promedio) y reseñas paginadas del álbum.<br> 2. Listado de reseñas en el perfil público de un usuario, filtrado por calificación (estrellas) => detalle de la reseña y link al álbum asociado.|
|CUU/Epic|1. Publicar y gestionar una reseña con calificación para un álbum o una canción específica<br>2. Realizar el upgrade de cuenta a plan PRO mediante pasarela de pago.|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género<br>4. CRUD Álbum<br>5. CRUD Reseña<br>6. CRUD Canción<br>7. CRUD Plan de membresía|
|CUU/Epic|1. **Sistema de Reseñas**: publicar y gestionar calificación y reseña tanto de álbumes como de canciones individuales.<br>2. **Pasarela de Pagos y Membresías**: integración con API de pagos (MercadoPago). Gestión de webhooks para actualizar el plan del usuario a PRO automáticamente. Esto elimina los anuncios en el frontend, habilita la personalización de perfil y desbloquea las estadísticas.<br>3. **Aporte y moderación de catálogo**: un usuario con membresía PRO puede dar de alta artistas, álbumes y canciones, que ingresan en estado `pending`; un usuario ADMIN los revisa y aprueba o rechaza, momento en el cual pasan a ser visibles y reseñables por toda la comunidad.<br>4. **Feed Social y Estadísticas Avanzadas**: generación de timeline global y cálculo de estadísticas analíticas (ej. "Tu año en música", "Géneros más escuchados"). Nota: las estadísticas están bloqueadas para usuarios FREE.|

**Relación entre los casos de uso** (requisito de que la data de un CUU sirva de input a otro):

```
CUU 2 (pago)  →  el usuario pasa a ser PRO
      →  habilita CUU 3 (aportar catálogo)  →  se crea y aprueba un álbum
            →  habilita CUU 1 (reseñar ese álbum)
                  →  alimenta CUU 4 (feed y estadísticas)
```


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Ranking global de usuarios más activos. <br>2. Panel de Administración (Dashboard Admin) con métricas de ingresos por membresías y cantidad de usuarios por plan.|
|CUU/Epic|1. Listas personalizadas: Creación y gestión de agrupaciones de álbumes públicas (ej. "Favoritos del Rock Nacional").<br>2. **Interacción social sobre las reseñas**: un usuario puede marcar con "me gusta" y comentar las reseñas de otros, y compartir el enlace de cualquiera de ellas. Requiere las dos estructuras agregadas al DER (`REVIEW_LIKES` y `REVIEW_COMMENTS`).|
|Otros|1. Autocompletado de metadatos al dar de alta un álbum desde el circuito de aporte Pro, reutilizando la data ya descargada por el procedimiento de seed.|

## Stack tecnológico

|Capa|Tecnología|
|:-|:-|
|Frontend|Vite + React + TypeScript, React Router, Context API + useReducer, SASS (arquitectura 7-1)|
|Backend|Node.js + Express + TypeScript, arquitectura en capas (routes → controller → service → repository)|
|Persistencia|MySQL 8 como servicio externo a la aplicación (no embebido), ORM Sequelize v6. Se trabaja contra una instancia local, acordado con la cátedra; el pasaje a un servicio cloud gestionado no requiere cambios de código, solo del `.env`|
|Validación|Zod|
|Autenticación|JWT propio + bcrypt, con 3 niveles de acceso (FREE, PRO, ADMIN)|
|Pagos|MercadoPago Checkout Pro (sandbox) con webhook de confirmación|
|Testing|Vitest + React Testing Library (frontend), Vitest + Supertest (backend), Playwright (E2E)|

## Pull requests

Pull requests del desarrollo, todos contra `develop` salvo donde se aclara.
Cada uno sale de un issue y lo revisa y mergea Santino Gallo. El estado de cada
issue y las correcciones de bugs están en
[`docs/tracking.md`](docs/tracking.md).

|PR|Rama|Contenido|Fecha|
|:-:|:-|:-|:-:|
|[#1](https://github.com/SantiiDev/DSW-TP/pull/1)|`feature/10-catalog-seed`|Seed del catálogo desde Deezer, en dos etapas|13/08|
|[#2](https://github.com/SantiiDev/DSW-TP/pull/2)|`feature/1-user-crud`|CRUD de usuario y autenticación con JWT y roles|13/08|
|[#3](https://github.com/SantiiDev/DSW-TP/pull/3)|`feature/1-user-crud`|Panel de administración y ajustes visuales del CRUD|14/08|
|[#4](https://github.com/SantiiDev/DSW-TP/pull/4)|`feature/1-user-crud`|Interfaz del perfil de usuario|18/08|
|[#6](https://github.com/SantiiDev/DSW-TP/pull/6)|`feature/1-user-crud` → `main`|Baja lógica de usuarios en vez de borrado físico|21/08|
|[#7](https://github.com/SantiiDev/DSW-TP/pull/7)|`feature/4-artist-crud`|CRUD de artista, incluido el circuito de propuestas|22/08|
|[#8](https://github.com/SantiiDev/DSW-TP/pull/8)|`feature/7-genre-crud`|CRUD de género: lecturas públicas, escritura solo ADMIN|22/08|
|[#9](https://github.com/SantiiDev/DSW-TP/pull/9)|`fix/genre-detail-improvements`|Ficha de género: tarjetas de álbum, filtros y paginado|25/08|
|[#10](https://github.com/SantiiDev/DSW-TP/pull/10)|`feature/5-album-crud`|CRUD de álbum y canción, colas de solicitudes y explorador conectado a datos reales|28/08|
|[#11](https://github.com/SantiiDev/DSW-TP/pull/11)|`feature/8-review-crud`|CRUD de reseña con interacción social (likes y comentarios)|28/08|

El PR #5 que aparece en el historial del repositorio pertenece al repositorio
original `utnfrrodsw/tp`, anterior al fork, y no es trabajo del grupo.
