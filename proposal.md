# Propuesta TP DSW

## Grupo
### Integrantes
* 55117 - Gallo, Santino
* 54507 - Esterri, Juan Ignacio
* 55037 - Siena, Santiago

### Repositorios
* [frontend app](http://hyperlinkToGihubOrGitlab)
* [backend app](http://hyperlinkToGihubOrGitlab)

## Tema
### Descripción
Musicboxd es una plataforma social y catálogo musical interactivo donde los usuarios pueden registrar, calificar con estrellas y reseñar los álbumes que escuchan. Contiene descubrimiento mediante un feed comunitario en tiempo real y rankings de los discos mejor valorados. Su modelo de negocio se basa en membresías escalables (Free, Pro y Patron), ofreciendo a los usuarios premium una experiencia sin anuncios, estadísticas detalladas y opciones de personalización avanzadas.

### Modelo
https://drive.google.com/file/d/1JxgweibKGHtelg-KoSr39efH760tSHDD/view?usp=sharing

## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género|
|CRUD dependiente|1. CRUD Álbum {depende de} CRUD Artista y CRUD Género<br>2. CRUD Reseña {depende de} CRUD Usuario y CRUD Álbum|
|Listado<br>+<br>detalle| 1. Listado de álbumes filtrado por género y/o año, muestra portada, título y artista => detalle muestra datos completos del álbum, tracklist y listado paginado de reseñas de usuarios.<br> 2. Listado de reseñas en el perfil público de un usuario, filtrado por calificación (estrellas) => detalle de la reseña y link al álbum asociado.|
|CUU/Epic|1. Publicar y gestionar una reseña con calificación para un álbum específico.<br>2. Realizar el upgrade de cuenta a plan PRO/PATRON mediante pasarela de pago.|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género<br>4. CRUD Álbum<br>5. CRUD Reseña<br>6. CRUD Canción|
|CUU/Epic|1. Sistema de Reseñas: Publicar y gestionar calificación y review de un álbum.<br>2. Feed Social y Estadísticas Avanzadas: Generación de timeline global y cálculo de estadísticas analíticas (ej. "Tu año en música", "Géneros más escuchados"). Nota: Las estadísticas están bloqueadas para usuarios FREE.<br>3. Pasarela de Pagos y Membresías: Integración con API de pagos (ej. MercadoPago/Stripe). Gestión de Webhooks para actualizar el plan del usuario a PRO o PATRON automáticamente. Esto elimina los anuncios en el frontend, habilita la personalización de perfil y desbloquea las estadísticas del CUU 2|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Ranking global de usuarios más activos. <br>2. Panel de Administración (Dashboard Admin) con métricas de ingresos por membresías y cantidad de usuarios por plan.|
|CUU/Epic|1. Listas personalizadas: Creación y gestión de agrupaciones de álbumes públicas (ej. "Favoritos del Rock Nacional").|
|Otros|1. Integración con API externa (ej. Last.fm o MusicBrainz) para pre-carga y autocompletado de metadatos/portadas de álbumes al registrarlos en el sistema.|
