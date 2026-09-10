# Estado del alcance

Qué está terminado y qué falta, punto por punto, contra el alcance comprometido
en la [propuesta](../proposal.md) y los requisitos del
[enunciado](enunciado.md).

Última revisión: **09/09/2026**.

## Requisitos técnicos

### Backend — regularidad

| Requisito | Estado | Dónde |
|:-|:-:|:-|
| Desarrollado en JavaScript (TypeScript sobre Node) | ✅ | `backend/src` |
| Framework web integrable por middlewares | ✅ | Express 5 |
| API web para el frontend | ✅ | API REST bajo `/api` ([routes.ts](../backend/src/routes.ts)) |
| Base de datos persistente por servicio externo, no embebida | ✅ | MySQL 8 como servicio aparte |
| Persistencia mediante un mapper | ✅ | Sequelize 6 con tipado nativo |
| Arquitectura en capas | ✅ | `routes → controller → service → repository → entity` |
| Validación de entrada y manejo de errores por la API | ✅ | Zod en un middleware + `errorHandler` único |
| Dependencias registradas para instalación automática | ✅ | `backend/package.json` |

### Backend — aprobación

| Requisito | Estado | Falta |
|:-|:-:|:-|
| Login propio con al menos 2 niveles de acceso | ✅ | JWT + bcrypt, con `FREE`, `PRO` y `ADMIN` |
| Rutas protegidas según el nivel de acceso | ✅ | `requireAuth` + `requireRole` |
| Ambientes definidos | ✅ | `.env` + `.env.example` |
| 1 test automatizado por integrante (3) | ❌ | No hay ninguno; falta instalar Vitest |
| 1 test de integración | ❌ | Falta; se haría con Vitest + Supertest sobre `app.ts` |

### Frontend — regularidad

| Requisito | Estado | Dónde |
|:-|:-:|:-|
| Framework de frontend | ✅ | React 19 + Vite |
| HTML5 | ✅ | — |
| CSS con preprocesador y metodología | ✅ | SASS con arquitectura 7-1 y clases BEM |
| Mobile-first | ✅ | Media queries `min-width` desde `abstracts/_breakpoints.scss` |
| Se ve bien en SM, MD y LG | ✅ | Breakpoints 576 / 768 / 1024 |
| Manejo de eventos del usuario | ✅ | Formularios, filtros, paginado |
| Manejo amigable de errores | ✅ | `core/utils/errorHandler` + componente `Alert` |
| Reactividad ante un estado | ✅ | `useState`, `useReducer` y Context |
| Input property / Output property | ✅ | Props tipadas y handlers `on...` en todos los componentes |
| Al menos un servicio | ✅ | Un servicio por feature, todos sobre `core/services/httpClient` |
| Modelos representados con clases o tipos propios | ✅ | `features/<x>/models/` |
| Algún patrón de diseño orientado a objetos | ✅ | Repository en el backend; Service + mapeo a modelos en el frontend |
| Dependencias registradas | ✅ | `frontend/package.json` |

### Frontend — aprobación

| Requisito | Estado | Falta |
|:-|:-:|:-|
| Login y protección de rutas según el nivel de usuario | ✅ | `ProtectedRoute` + `AuthContext` |
| Ambientes definidos | ✅ | `.env` con prefijo `VITE_` |
| 1 test unitario de un componente | ❌ | Falta instalar Vitest + React Testing Library |
| 1 test end-to-end | ❌ | Falta instalar Playwright |

## Requisitos funcionales

### CRUDs

| CRUD | Backend | Frontend |
|:-|:-:|:-:|
| Usuario | ✅ | ✅ Panel de administración |
| Artista | ✅ | ✅ |
| Género | ✅ | ✅ |
| Álbum | ✅ | ✅ |
| Canción | ✅ | ✅ |
| Reseña | ✅ | ✅ |
| Plan de membresía | ✅ | ✅ Pestaña "Planes" del panel de administración |

### Listados con filtro y detalle

| Listado | Estado |
|:-|:-:|
| Álbumes filtrados por género y/o año → ficha con tracklist y reseñas | ✅ |
| Reseñas del perfil de un usuario filtradas por calificación → detalle y link al álbum | ✅ |

### Casos de uso / epics

| CUU | Estado | Detalle |
|:-|:-:|:-|
| 1 — Sistema de reseñas (álbumes y canciones) | ✅ | Alta, edición, baja, likes y comentarios |
| 2 — Pasarela de pagos y membresías | ✅ | Checkout Pro en sandbox, webhook y confirmación al volver |
| 3 — Aporte y moderación de catálogo | ✅ | Alta en estado `pending` por un `PRO`, aprobación por un `ADMIN` |
| 4 — Feed social y estadísticas avanzadas | ❌ | No hay timeline global ni estadísticas analíticas. La única estadística es el histograma de calificaciones del perfil (`GET /api/reviews/stats`), que además es público en lugar de estar bloqueado para usuarios `FREE`. |

La relación entre casos de uso comprometida en la propuesta está encadenada hasta
el CUU 1: el pago del CUU 2 convierte al usuario en `PRO`, eso lo habilita a
aportar catálogo en el CUU 3, y sobre ese catálogo aprobado se publican las
reseñas del CUU 1. El último eslabón —que esas reseñas alimenten el feed y las
estadísticas— depende del CUU 4, que todavía no está.

### Alcance adicional voluntario

| Ítem | Estado |
|:-|:-:|
| Interacción social sobre reseñas (likes y comentarios) | ✅ |
| Listas personalizadas de álbumes | ❌ La página `/lists` existe pero muestra datos fijos |
| Ranking global de usuarios más activos | ❌ |
| Dashboard de administración con métricas de ingresos | ❌ |
| Autocompletado de metadatos en el alta de un álbum | ❌ |

## Documentación de la entrega

| Contenido | Regularidad | Estado |
|:-|:-:|:-:|
| Propuesta actualizada | X | ✅ |
| Links a los PR | X | ✅ [tracking.md](tracking.md) y [propuesta](../proposal.md#pull-requests) |
| Instrucciones de instalación | X | ✅ [README del proyecto](../README.md) |
| Minutas de reunión y avance | X | ⚠️ [minutas.md](minutas.md) — faltan las reuniones anteriores al 09/09 |
| Tracking de features, bugs e issues | X | ✅ [tracking.md](tracking.md) |
| Documentación de la API | Aprobación | ❌ |
| Evidencia de ejecución de tests | Aprobación | ❌ |
| Video demo | Aprobación | ❌ |
| Deploy y credenciales | Aprobación | ❌ |

## Deuda conocida

Cosas que funcionan pero no están como deberían, ordenadas por prioridad:

1. **`/members` y `/lists` muestran datos fijos.** Sus siete secciones
   (`FeaturedMembers`, `PopularReviewers`, `MemberReviews`, `MemberLists`,
   `TopListsSection`, `TrendingListsSection`, `ExploreTagsSection`) tienen los
   datos escritos en el componente en lugar de pedirlos a la API. Hay que
   conectarlas o sacarlas.
2. **Los beneficios Pro no se cumplen todos.** El sitio promete "sin anuncios" y
   "estadísticas desbloqueadas", pero no existe ningún componente de anuncios que
   se le muestre a un `FREE` ni ninguna estadística que dependa del rol.
3. **Falta el CUU 4 entero**, que es el que cierra la cadena de casos de uso
   comprometida en la propuesta.
4. **No hay ni un test automatizado** en ninguna de las dos apps.
