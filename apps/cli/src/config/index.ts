import { env } from "./env";

export const cliConfig = {
  db: {
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    name: env.DATABASE_NAME,
    ssl: env.DATABASE_SSL,
  },
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  auth: {
    secret: env.AUTH_SECRET,
    baseUrl: env.AUTH_BASE_URL,
  },
  admin: {
    email: env.CLI_ADMIN_EMAIL,
    password: env.CLI_ADMIN_PASSWORD,
  },
};
