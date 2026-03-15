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
  CLI_ADMIN_EMAIL: z.email().min(1),
  CLI_ADMIN_PASSWORD: z.string().min(1),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
