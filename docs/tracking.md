# Tracking de features, bugs e issues

Registro del trabajo del equipo sobre el repositorio
[SantiiDev/DSW-TP](https://github.com/SantiiDev/DSW-TP).

La herramienta de trackeo es **GitHub Issues + GitHub Projects** sobre el mismo
repositorio, para que cada issue quede vinculado a su rama y a su pull request
sin tener que sincronizar dos sistemas a mano. Este archivo es el volcado de ese
tablero al repositorio, que es lo que pide [`docs.md`](../docs.md).

## Cómo se trabaja

1. Cada ítem del alcance de la [propuesta](../proposal.md) se abre como un
   **issue** y se asigna a un integrante según el reparto de features.
2. Del issue sale una rama desde `develop`, con el nombre
   `feature/<número-de-issue>-<descripción-corta>` (o `fix/<descripción>` para
   los arreglos). El número en el nombre de la rama es lo que ata la rama al
   issue.
3. Al terminar se abre un **pull request** contra `develop`, vinculado al issue.
4. **Santino Gallo** revisa y mergea. Nadie mergea su propio PR.
5. `main` queda para las versiones entregadas a la cátedra.

## Reparto de features

Definido para que dos personas no toquen los mismos archivos y no haya conflictos
de merge (está también en [`CLAUDE.md`](../CLAUDE.md)):

| Integrante | Features a cargo |
|:-|:-|
| Santino Gallo | `user`, `auth`, `membership` (plan, subscription, payment), seed del catálogo |
| Juan Ignacio Esterri | `artist`, `album`, `song` |
| Santiago Siena | `genre`, `review` |

## Issues

Los títulos son los de las ramas que salieron de cada issue.

| # | Issue | Responsable | Estado |
|:-:|:-|:-|:-|
| [#1](https://github.com/SantiiDev/DSW-TP/issues/1) | CRUD de Usuario | Santino Gallo | Cerrado |
| [#2](https://github.com/SantiiDev/DSW-TP/issues/2) | Listado de reseñas en el perfil de un usuario | Santiago Siena | Cerrado |
| [#3](https://github.com/SantiiDev/DSW-TP/issues/3) | CUU 2 — Upgrade a Pro con pasarela de pago | Santino Gallo | Cerrado |
| [#4](https://github.com/SantiiDev/DSW-TP/issues/4) | CRUD de Artista | Juan Ignacio Esterri | Cerrado |
| [#5](https://github.com/SantiiDev/DSW-TP/issues/5) | CRUD de Álbum | Juan Ignacio Esterri | Cerrado |
| [#6](https://github.com/SantiiDev/DSW-TP/issues/6) | Listado de álbumes con filtro por género y año | Juan Ignacio Esterri | Cerrado |
| [#7](https://github.com/SantiiDev/DSW-TP/issues/7) | CRUD de Género | Santiago Siena | Cerrado |
| [#8](https://github.com/SantiiDev/DSW-TP/issues/8) | CRUD de Reseña | Santiago Siena | Cerrado |
| [#9](https://github.com/SantiiDev/DSW-TP/issues/9) | CUU 1 — Publicar y gestionar una reseña | Santiago Siena | Cerrado |
| [#10](https://github.com/SantiiDev/DSW-TP/issues/10) | Seed del catálogo desde Deezer | Santino Gallo | Cerrado |
| — | Documentación de la entrega (`docs/`, README del proyecto, DER en Mermaid) | Santino Gallo | Cerrado (falta abrir el issue) |
| — | UI de administración del CRUD de Plan de membresía | Santino Gallo | Cerrado (falta abrir el issue) |
| — | Seguimiento entre usuarios (relación `FOLLOWS`) | Santino Gallo | Cerrado (falta abrir el issue) |
| — | CUU 4 (parte 1) — Feed social de reseñas | Santiago Siena | Cerrado (falta abrir el issue) |

> Las cuatro últimas se trabajaron antes de abrir su issue y entraron juntas por
> el PR #13. Hay que crearlas en el GitHub Project y vincularlas a ese pull
> request, para que la trazabilidad quede completa antes de la entrega.

### Pendientes de abrir

Lo que falta del alcance y todavía no tiene issue. El detalle de cada uno está en
[estado-alcance.md](estado-alcance.md).

| Ítem | Responsable propuesto | Prioridad |
|:-|:-|:-|
| CUU 4 (parte 2) — Estadísticas avanzadas y bloqueo para `FREE` | A definir | Alta |
| Conectar `/lists` a la API (hoy son datos fijos) | A definir | Alta |
| Tests automatizados (3 unitarios + 1 de integración en backend) | Uno por integrante | Alta (aprobación) |
| Test unitario de componente + test E2E (frontend) | A definir | Alta (aprobación) |
| Documentación de la API | A definir | Alta (aprobación) |
| Deploy y credenciales de la app publicada | A definir | Alta (aprobación) |

## Pull requests

Todos contra `develop`, salvo donde se aclara. Revisados y mergeados por Santino
Gallo.

| PR | Rama | Contenido | Fecha | Autor |
|:-:|:-|:-|:-:|:-|
| [#1](https://github.com/SantiiDev/DSW-TP/pull/1) | `feature/10-catalog-seed` | Seed del catálogo desde Deezer, en dos etapas | 13/08 | Santino Gallo |
| [#2](https://github.com/SantiiDev/DSW-TP/pull/2) | `feature/1-user-crud` | CRUD de usuario y autenticación con JWT y roles | 13/08 | Santino Gallo |
| [#3](https://github.com/SantiiDev/DSW-TP/pull/3) | `feature/1-user-crud` | Panel de administración y ajustes visuales del CRUD | 14/08 | Santino Gallo |
| [#4](https://github.com/SantiiDev/DSW-TP/pull/4) | `feature/1-user-crud` | Interfaz del perfil de usuario | 18/08 | Santino Gallo |
| [#6](https://github.com/SantiiDev/DSW-TP/pull/6) | `feature/1-user-crud` → `main` | Baja lógica de usuarios en vez de borrado. **Revertido el 26/08**: el merge fue contra `main` en vez de `develop`. El contenido volvió a entrar por la vía normal. | 21/08 | Santino Gallo |
| [#7](https://github.com/SantiiDev/DSW-TP/pull/7) | `feature/4-artist-crud` | CRUD de artista, incluido el circuito de propuestas | 22/08 | Juan Ignacio Esterri |
| [#8](https://github.com/SantiiDev/DSW-TP/pull/8) | `feature/7-genre-crud` | CRUD de género: lecturas públicas, escritura solo ADMIN | 22/08 | Santiago Siena |
| [#9](https://github.com/SantiiDev/DSW-TP/pull/9) | `fix/genre-detail-improvements` | Ficha de género: tarjetas de álbum, filtros y paginado | 25/08 | Santiago Siena |
| [#10](https://github.com/SantiiDev/DSW-TP/pull/10) | `feature/5-album-crud` | CRUD de álbum y canción, colas de solicitudes, explorador conectado a datos reales | 28/08 | Juan Ignacio Esterri |
| [#11](https://github.com/SantiiDev/DSW-TP/pull/11) | `feature/8-review-crud` | CRUD de reseña con interacción social (likes y comentarios) | 28/08 | Santiago Siena |
| [#12](https://github.com/SantiiDev/DSW-TP/pull/12) | `feature/9-review-epic-publish` | Página de detalle de reseña y pestañas de ítems calificados | 05/09 | Santiago Siena |
| [#13](https://github.com/SantiiDev/DSW-TP/pull/13) | `feature/13-social-feed` | Cuatro commits: documentación de la entrega, ABM de planes, seguimiento entre usuarios y CUU 4 (feed social) | 10/09 | Santino Gallo y Santiago Siena |

> El PR #5 del historial del repositorio pertenece al repositorio original
> `utnfrrodsw/tp`, anterior al fork, y no es trabajo del grupo.

> **Sobre el PR #13.** El trabajo se había separado en tres ramas encadenadas
> (`docs/entrega-regularidad` → `feature/12-user-follow` → `feature/13-social-feed`)
> para que cada parte se revisara por separado. Como estaban apiladas, la última
> contenía las tres, y al mergearla entraron los cuatro commits de una sola vez;
> los otros dos pull requests quedaron sin diferencias que mostrar y se cerraron.
> Se deja asentado acá porque el historial de GitHub muestra un solo PR donde el
> reparto del trabajo fue de dos integrantes.

## Bugs y correcciones

| Qué | Cómo se resolvió | Fecha |
|:-|:-|:-:|
| El borrado de usuario eliminaba la fila y se llevaba puestas sus reseñas | Se cambió por baja lógica (`state = 'suspended'`) con un endpoint inverso para reactivar | 21/08 |
| PR #6 mergeado contra `main` en lugar de `develop` | Se revirtió el merge en `main` y el contenido se reincorporó por `develop` | 26/08 |
| Errores de maquetado en el explorador de música y en el listado de álbumes | Corrección de CSS (centrado, componentes, contenedores) | 25/08 y 01/09 |
| El índice único de la base quedaba mal armado al recrear las tablas | Script de mantenimiento `npm run db:fix-indexes` | — |
| Bases creadas con el nivel `PATRON`, que se eliminó del modelo | Script de migración `npm run db:migrate:patron` | — |
| Dos integrantes escribieron `optional-auth.ts` en paralelo, con comportamientos opuestos ante un token inválido | Se resolvió a favor de **ignorar el token inválido y seguir como visitante**, en lugar de cortar con 401. El `httpClient` no maneja el 401, así que cortar dejaría a alguien con la sesión vencida viendo un error en una página pública (`/reviews`) en vez del contenido | 10/09 |
| El precio de un plan con centavos se mostraba redondeado ($1.750,50 salía como "$ 1.751") | `Plan.priceLabel` muestra los decimales solo cuando el monto los tiene | 10/09 |
| `.review-card` estaba definida dos veces (`_review.scss` y `_members-explore.scss`) y solo se resolvía bien por el orden de los imports | La colisión desapareció al eliminar `/members` y su hoja de estilos | 10/09 |

## Deuda de proceso

Cosas que se hicieron fuera del flujo acordado y hay que regularizar antes de la
entrega. Se dejan asentadas acá en lugar de taparlas, porque afectan la
trazabilidad del trabajo:

- **El epic de membresía y pago (issue #3) entró sin pull request.** Todo el
  backend de `plan`, `subscription` y `payment`, más las pantallas de `/pro`,
  llegaron a `develop` en el commit directo `21da334`, cuyo mensaje además dice
  "Frontend correction in music and albums" y no refleja lo que contiene.
  **Acción**: abrir el PR de la entrega (`develop` → `main`) y describir ahí el
  alcance del epic, para que el trabajo quede vinculado al issue #3.
- **Otros seis commits fueron directos a `develop`** sin pasar por PR:
  `09afad5`, `64f2f3f`, `cad8b1b`, `cb3164a`, `21da334` y `1fc048d`.
- **`main` está 27 commits atrás de `develop`.** La entrega de regularidad tiene
  que salir de un merge de `develop` a `main`.
- **La carga de trabajo está repartida de forma despareja** en el historial: de
  los 36 commits del desarrollo (sin contar merges ni el historial heredado del
  fork), 27 son de Santino Gallo, 5 de Juan Ignacio Esterri y 4 de Santiago
  Siena. La cátedra evalúa la participación de cada integrante, así que conviene
  repartir lo que falta de manera que el historial lo refleje.
- **El PR #13 juntó cuatro commits de dos áreas distintas.** Se había separado en
  tres ramas para poder revisarlo por partes, pero al estar encadenadas se mergeó
  todo junto (ver la nota de la tabla de pull requests). Para lo que queda
  conviene que las ramas salgan de `develop` en paralelo y no una de otra, salvo
  que haya una dependencia real de código.
