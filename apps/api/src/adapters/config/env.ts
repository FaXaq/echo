import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive(),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_SSL: z
    .string()
    .transform((v) => v === "true")
    .pipe(z.boolean()),
  PORT: z.coerce.number().int().positive(),
  HOST: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_BASE_URL: z.url(),
  AUTH_TRUSTED_ORIGINS: z.string().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_FROM: z.string().min(1),
  APP_BASE_URL: z.url(),
  S3_BUCKET_NAME: z.string().min(1),
  S3_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_ENDPOINT_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
