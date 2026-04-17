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
Aplicación web full-stack orientada a funcionar como una red social y bitácora musical. Los usuarios podrán buscar música (artistas, álbumes, canciones), calificarla, dejar reseñas y llevar un registro ("log") de sus escuchas.

### Modelo
https://drive.google.com/file/d/1CtgrTv1I3zjxSmRuSaseUSWv7PB62EM7/view?usp=sharing

## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género|
|CRUD dependiente|1. CRUD Álbum {depende de} CRUD Artista y CRUD Género<br>2. CRUD Reseña {depende de} CRUD Usuario y CRUD Álbum|
|Listado<br>+<br>detalle| 1. Listado de álbumes filtrado por género y/o año, muestra portada, título y artista => detalle muestra datos completos del álbum, tracklist y listado paginado de reseñas de usuarios.<br> 2. Listado de reseñas en el perfil público de un usuario, filtrado por calificación (estrellas) => detalle de la reseña y link al álbum asociado.|
|CUU/Epic|1. Publicar y gestionar una reseña con calificación para un álbum específico.<br>2. Visualizar el timeline social interactivo con las últimas interacciones de la comunidad.|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Artista<br>3. CRUD Género<br>4. CRUD Álbum<br>5. CRUD Reseña<br>6. CRUD Canción|
|CUU/Epic|1. Sistema de Reseñas: Publicar y gestionar calificación (rating) y review de un álbum validando unicidad.<br>2. Timeline interactivo y métricas: Generación del feed de actividad global y cálculo dinámico de los "Álbumes mejor calificados" utilizando los datos de las reseñas (Relacionado al CUU 1).<br>3. Panel de Administración: Dashboard exclusivo para rol Admin con métricas de negocio y tabla de moderación para ocultar/eliminar reseñas (Requiere manejo de JWT y rutas protegidas).|


### Alcance Adicional Voluntario

|Req|Detalle|
|Listados |1. Ranking global de usuarios más activos (con mayor cantidad de reseñas). <br>2. Listado de "Tendencias": Álbumes con mayor cantidad de reseñas en la última semana.|
|CUU/Epic|1. Listas personalizadas: Creación y gestión de agrupaciones de álbumes públicas (ej. "Favoritos del Rock Nacional").|
|Otros|1. Integración con API externa (ej. Last.fm o MusicBrainz) para pre-carga y autocompletado de metadatos/portadas de álbumes al registrarlos en el sistema.|
