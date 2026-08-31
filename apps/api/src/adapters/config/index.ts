import { env } from "./env";

export const appConfig = {
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
    trustedOrigins: env.AUTH_TRUSTED_ORIGINS?.split(",").map((o) => o.trim()),
  },
  mailer: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    from: env.SMTP_FROM,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  },
  appBaseUrl: env.APP_BASE_URL,
  s3: {
    bucket: env.S3_BUCKET_NAME,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT_URL,
  },
  mapbox: {
    accessToken: env.MAPBOX_ACCESS_TOKEN,
  },
};
