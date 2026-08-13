// Lee y valida las variables de entorno una sola vez al arrancar la app.
// Si falta una variable obligatoria, el proceso falla acá con un mensaje claro
// en vez de romper más adelante con un error confuso de conexión.
import 'dotenv/config';

// Devuelve el valor de una variable obligatoria; corta la ejecución si no está.
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá backend/.env.example a backend/.env y completala.`
    );
  }
  return value;
}

// Devuelve el valor de una variable opcional, o el default indicado.
function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

// Interpreta una variable de texto como booleano ("true" / "false").
function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: optional('NODE_ENV', 'development') === 'production',
  port: Number(optional('PORT', '3000')),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  db: {
    host: required('DB_HOST'),
    port: Number(optional('DB_PORT', '3306')),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: optional('DB_PASSWORD', ''),
    // En MySQL local va en false. En el servicio cloud (Aiven) va en true
    // y hay que cargar el certificado CA que provee el proveedor.
    ssl: bool('DB_SSL', false),
    sslCa: optional('DB_SSL_CA', ''),
    // sync crea/actualiza las tablas al arrancar. Solo para desarrollo.
    sync: bool('DB_SYNC', false),
    logging: bool('DB_LOGGING', false),
  },

  // Servicio de metadata musical (Deezer). Lo usa ÚNICAMENTE el script de descarga
  // `seed/fetch-metadata.ts`, que se corre a mano una sola vez. Ni la API ni el
  // frontend consultan este servicio en runtime.
  metadata: {
    baseUrl: optional('METADATA_API_BASE_URL', 'https://api.deezer.com'),
    // Deezer limita a ~50 pedidos cada 5 segundos por IP. 150ms entre llamadas deja
    // un margen cómodo por debajo de ese techo.
    requestDelayMs: Number(optional('METADATA_REQUEST_DELAY_MS', '150')),
    maxRetries: Number(optional('METADATA_MAX_RETRIES', '4')),
  },

  // Usuario administrador que crea el seed. Tiene valores por defecto para que la
  // base quede usable con solo clonar el repo y correr `npm run seed`; en un entorno
  // real se pisan desde el .env.
  seedAdmin: {
    username: optional('SEED_ADMIN_USERNAME', 'admin'),
    email: optional('SEED_ADMIN_EMAIL', 'admin@musicboxd.com'),
    password: optional('SEED_ADMIN_PASSWORD', 'Admin1234!'),
  },

  // Estas se empiezan a usar en fases posteriores; por eso son opcionales todavía.
  auth: {
    jwtSecret: optional('JWT_SECRET', ''),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },
} as const;
