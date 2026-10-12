// Test de integración del circuito de autenticación.
//
// A diferencia de los unitarios, acá NO se prueba una función suelta: se le pega
// a la app entera con Supertest y cada request recorre las cinco capas
// (routes → validate → controller → service → repository → entity), más MySQL,
// bcrypt y la firma del JWT.
//
// Requiere la base levantada y `npm run seed` ya ejecutado, porque usa el
// usuario administrador que crea el seed. Ninguno de los casos escribe nada:
// la suite es de solo lectura y se puede correr las veces que haga falta.
//
// La app se importa de app.ts y no de server.ts: app.ts no llama a listen(),
// así que Supertest la levanta en un puerto al azar y no choca con el `npm run
// dev` que puedas tener abierto.
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app';
import { env } from '../../src/shared/config/env';
import { sequelize } from '../../src/shared/db/sequelize';

// Las credenciales salen de la misma configuración que usa el seed, no
// hardcodeadas: si el equipo cambia el SEED_ADMIN_* del .env, el test sigue andando.
const adminCredentials = {
  email: env.seedAdmin.email,
  password: env.seedAdmin.password,
};

// Sequelize deja abierto su pool de conexiones. Sin este cierre, Vitest termina
// los tests pero el proceso queda colgado esperando que el socket se libere.
afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/auth/login', () => {
  it('devuelve el usuario y un token con las credenciales correctas', async () => {
    const response = await request(app).post('/api/auth/login').send(adminCredentials);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe(adminCredentials.email);
    expect(response.body.user.rol).toBe('ADMIN');
  });

  it('nunca devuelve el hash de la contraseña', async () => {
    // Es la regla más importante de toda la API y la más fácil de romper sin
    // darse cuenta: alcanza con que alguien devuelva la fila de Sequelize tal
    // como vino de la base en vez de pasarla por toPublicUser().
    const response = await request(app).post('/api/auth/login').send(adminCredentials);

    expect(response.body.user.password).toBeUndefined();
  });

  it('rechaza una contraseña incorrecta con 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: adminCredentials.email, password: 'no-es-la-contraseña' });

    expect(response.status).toBe(401);
    // Formato de error único de toda la API, armado por el errorHandler.
    expect(response.body.message).toBe('El email o la contraseña son incorrectos.');
  });

  it('rechaza un email mal formado con 400 y el detalle del campo', async () => {
    // Este ni siquiera llega al controller: lo corta el middleware validate()
    // con el schema de Zod, antes de tocar la base.
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'esto-no-es-un-email', password: 'Admin1234!' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: 'email',
      message: 'El email no tiene un formato válido.',
    });
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el perfil del dueño del token', async () => {
    const login = await request(app).post('/api/auth/login').send(adminCredentials);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(adminCredentials.email);
  });

  it('responde 401 si no se manda el token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});

describe('Rutas inexistentes', () => {
  it('responde 404 con el formato de error de la API', async () => {
    const response = await request(app).get('/api/no-existe');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('La ruta GET /api/no-existe no existe.');
  });
});
