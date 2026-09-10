# Minutas de reunión y avance

> **Nota para el equipo antes de la entrega.** Las secciones
> [Registro de avances](#registro-de-avances) y
> [Decisiones tomadas](#decisiones-tomadas) están reconstruidas a partir de lo
> que quedó asentado en el repositorio (commits, pull requests y documentación),
> así que son verificables una por una. La sección
> [Minutas](#minutas) tiene el formato acordado y la primera entrada cargada:
> **las reuniones que falten hay que completarlas con el registro propio del
> equipo** (fecha real, quiénes estuvieron y qué se acordó). No se inventan.

## Metodología y cadencia

- **Metodología**: Scrum adaptado a un equipo de tres integrantes.
- **Iteraciones**: dos semanas. Cada iteración cierra con las features de su
  alcance mergeadas a `develop`.
- **Sincronización**: una reunión semanal por videollamada, más coordinación
  diaria asincrónica por el grupo de mensajería del equipo.
- **Tablero**: GitHub Projects sobre el repositorio, volcado a
  [tracking.md](tracking.md).
- **Revisión**: ningún integrante mergea su propio pull request; los revisa y
  mergea Santino Gallo.

## Formato de una minuta

```markdown
### <Fecha> — <Título de la reunión>

**Participantes:** ...
**Duración:** ...

**Temas tratados**
- ...

**Decisiones**
- ...

**Tareas asignadas**
| Tarea | Responsable | Issue |
|:-|:-|:-|

**Pendientes para la próxima**
- ...
```

## Registro de avances

Cada fila tiene su evidencia en el repositorio. El detalle de los pull requests
está en [tracking.md](tracking.md).

| Fecha | Avance | Evidencia |
|:-:|:-|:-|
| 08/07/2026 | Estructura base del monorepo: carpetas `frontend/` y `backend/` sobre el fork de la cátedra | `d3d1fb1` |
| 09/07 – 17/07 | Landing page completa: navbar, hero, secciones, CTA, footer, páginas de miembros, listas, música y Pro | `d241050` … `92b5e63` |
| 13/07/2026 | Interfaz de login y registro | `5458544` |
| 11/08/2026 | Base de datos creada y estructura del backend en capas | `93a7832` |
| 13/08/2026 | Seed del catálogo desde Deezer, en dos etapas (PR #1) | `a6c1397` |
| 13/08/2026 | Autenticación con JWT y roles + CRUD de usuario (PR #2) | `454259e`, `f488d9c` |
| 14/08 – 18/08 | Panel de administración e interfaz del perfil de usuario (PR #3 y #4) | `6b1d094`, `03571e1` |
| 21/08/2026 | Baja lógica de usuarios en lugar de borrado físico | `64984f3` |
| 22/08/2026 | CRUD de artista con circuito de propuestas (PR #7) | `d5d3ebb` |
| 22/08/2026 | CRUD de género (PR #8) | `04ec005` |
| 25/08/2026 | Ficha de género con tarjetas, filtros y paginado (PR #9) | `4db142e` |
| 27/08 – 28/08 | CRUD de álbum y canción, colas de solicitudes y explorador conectado a datos reales (PR #10) | `ad4cd77`, `b27a4fe` |
| 28/08/2026 | CRUD de reseña con likes y comentarios (PR #11) | `186f5e4` |
| 01/09/2026 | Epic de membresía completo: planes, suscripciones y pago con MercadoPago | `21da334` |
| 09/09/2026 | Documentación del proyecto (`docs/`), README del proyecto y UI de administración de planes | esta entrega |

## Decisiones tomadas

Decisiones de equipo que condicionan el resto del desarrollo. Cada una está
documentada en detalle en el lugar que se indica, y hay que poder defenderlas
oralmente.

| Fecha | Decisión | Motivo | Dónde está documentada |
|:-:|:-|:-|:-|
| 11/08 | La base de datos propia es la **única fuente de verdad en runtime**: ninguna parte del sistema consulta APIs de música durante su funcionamiento | Los CRUD del catálogo tienen que ser operaciones reales sobre tablas propias, no un proxy de un servicio ajeno | [backend/README](../backend/README.md#la-base-propia-es-la-única-fuente-de-verdad) |
| 11/08 | Arquitectura en capas estricta `routes → controller → service → repository → entity` | Que cada capa tenga una sola responsabilidad y se pueda explicar en la defensa | [backend/README](../backend/README.md#arquitectura-en-capas) |
| 11/08 | `entities/` va fuera de `features/`, con todas las asociaciones en `entities/index.ts` | Las entidades de Sequelize son un grafo conectado; repartirlas por feature generaría imports circulares | [CLAUDE.md](../CLAUDE.md) |
| 13/08 | **Deezer** como origen del catálogo inicial, en lugar de Spotify | Endpoints públicos sin OAuth, géneros a nivel álbum (como los modela el DER) y términos de uso que no restringen persistir el catálogo | [propuesta](../proposal.md#origen-de-los-datos-del-catálogo) |
| 13/08 | El seed se parte en dos etapas: `seed:fetch` (baja los datos, una sola vez) y `seed` (los carga, sin internet y de forma idempotente) | Hace reproducible la carga: da siempre el mismo resultado aunque el servicio externo esté caído | [backend/README](../backend/README.md#las-dos-etapas-y-por-qué-están-separadas) |
| 13/08 | Sin columna para el id externo: la idempotencia se resuelve por clave natural | No desviarse del pasaje a tablas aprobado en la propuesta | [propuesta](../proposal.md#origen-de-los-datos-del-catálogo) |
| 13/08 | Autenticación con JWT propio + bcrypt y tres niveles de acceso (`FREE`, `PRO`, `ADMIN`) | Cumple el requisito de login propio con al menos dos niveles, y el tercero es el que habilita el circuito de moderación | [backend/README](../backend/README.md#autenticación-y-roles) |
| 21/08 | La baja de usuario es **lógica** (`state = 'suspended'`), no física | Borrar la fila se llevaba puestas las reseñas del usuario, que son contenido de la comunidad | [backend/README](../backend/README.md#reglas-de-negocio-en-el-modelo) |
| 22/08 | El contenido aportado por un `PRO` entra en estado `pending` y lo aprueba un `ADMIN` | Es lo que convierte el alta de catálogo en un caso de uso con valor de negocio y no en un formulario suelto | [propuesta](../proposal.md#alcance-mínimo) |
| 28/08 | `REVIEW_LIKES` como relación N:M y `REVIEW_COMMENTS` como entidad débil, en vez de un contador dentro de `REVIEW` | Un contador no registra *quién* reaccionó: sin ese dato no se puede impedir el doble "me gusta" ni retirarlo | [propuesta](../proposal.md#modelo) |
| 01/09 | La membresía es mensual con **renovación manual**, no débito automático | El cobro recurrente es otro producto de MercadoPago (`preapproval`) y exigiría agregar al DER una columna para el id de la suscripción externa | [backend/README](../backend/README.md#renovación-manual-no-débito-automático) |
| 01/09 | A MercadoPago se le habla con `fetch`, sin el SDK | Son dos llamadas y así queda a la vista qué se manda y qué se recibe | [CLAUDE.md](../CLAUDE.md) |
| 09/09 | La base de datos se mantiene en **MySQL local**, acordado con la cátedra | — | [README del proyecto](../README.md#requisitos) |

## Minutas

### 09/09/2026 — Planificación de la entrega de regularidad

**Participantes:** Santino Gallo, Juan Ignacio Esterri, Santiago Siena

**Temas tratados**

- Revisión del estado del proyecto contra el alcance comprometido en la
  [propuesta](../proposal.md), de cara a la entrega del 12/10 al 16/10.
- Faltantes de documentación detectados: no existía el directorio `docs/`, el
  `README.md` de la raíz seguía siendo el enunciado del fork y la propuesta no
  tenía los links a los pull requests.
- Estado del CRUD de Plan de membresía: completo en el backend, sin pantalla de
  administración en el frontend.

**Decisiones**

- Se crea el directorio `docs/` con este archivo, el
  [tracking](tracking.md) y el [estado del alcance](estado-alcance.md), y se lo
  enlaza desde el README del proyecto.
- El `README.md` de la raíz pasa a ser el del proyecto, con las instrucciones
  para levantarlo; el enunciado de la cátedra se conserva en
  [`docs/enunciado.md`](enunciado.md).
- Se agrega la pestaña "Planes" al panel de administración, para cerrar el CRUD
  de Plan de membresía.
- La base de datos se mantiene en MySQL local, según lo conversado con la
  cátedra.

**Tareas asignadas**

| Tarea | Responsable | Issue |
|:-|:-|:-|
| Documentación del proyecto (`docs/`, README raíz, links a los PR) | Santino Gallo | — |
| UI de administración del CRUD de Plan de membresía | Santino Gallo | A abrir |
| Reemplazar los datos fijos de `/members` y `/lists` por datos de la API | A definir | A abrir |
| CUU 4 — Feed social y estadísticas avanzadas | A definir | A abrir |

**Pendientes para la próxima**

- Repartir el CUU 4 y los tests automatizados entre los tres integrantes.
- Abrir el pull request de la entrega (`develop` → `main`) y describir ahí el
  epic de membresía, que entró sin PR.
- Definir plataforma de deploy y quién lo hace.

---

<!--
Para agregar una minuta nueva: copiar el bloque de formato de arriba y sumarla
acá, de la más reciente a la más antigua.
-->
