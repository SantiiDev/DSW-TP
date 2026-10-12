// Rutas del CRUD de anuncios, montadas en /api/ads.
//
//   GET    /api/ads/active  anuncios en circulación, PIDE SESIÓN
//   GET    /api/ads         todos, activos e inactivos, solo ADMIN
//   POST   /api/ads         alta de un anuncio, solo ADMIN
//   PATCH  /api/ads/:id     edición de un anuncio, solo ADMIN
//   DELETE /api/ads/:id     elimina el anuncio, solo ADMIN
//
// Las dos lecturas están separadas en vez de ser un /api/ads?active=true porque
// piden permisos distintos: la del panel lateral le sirve a cualquiera con sesión
// y la del panel de administración es de ADMIN. Así cada una se resuelve entera
// con middlewares y al service no le queda ningún chequeo de acceso, igual que en
// el CRUD de géneros.
//
// El listado público pide token (y no es público como el de géneros) porque los
// anuncios se le muestran únicamente a un usuario FREE logueado: un visitante sin
// cuenta no los ve, así que tampoco tiene por qué poder pedirlos.
//
// OJO con el orden: /active va ANTES que /:id. Express prueba las rutas en orden,
// y /:id tomaría "active" como si fuera un id, que la validación rechazaría con un
// 400. Es la misma regla que ya se aplica un nivel más arriba en routes.ts.
import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';
import { validate } from '../../shared/middlewares/validate';
import { adController } from './ad.controller';
import { adIdParamSchema, createAdSchema, updateAdSchema } from './ad.schema';

export const adRouter = Router();

adRouter.get('/active', requireAuth, adController.listActive);

adRouter.get('/', requireAuth, requireRole('ADMIN'), adController.list);

adRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createAdSchema }),
  adController.create
);

adRouter.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: adIdParamSchema, body: updateAdSchema }),
  adController.update
);

adRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: adIdParamSchema }),
  adController.remove
);
