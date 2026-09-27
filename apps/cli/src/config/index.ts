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
  s3: {
    bucket: env.S3_BUCKET_NAME,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT_URL,
  },
};
