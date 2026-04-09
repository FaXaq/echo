import { makeDbAdapter } from "@echo/db";
import { makeServerAuth } from "@echo/auth";
import { z } from "zod";
import { makeLogger } from "@echo/logger";

const logger = makeLogger();

const input = z
  .object({
    SEED_EMAIL: z.email(),
    SEED_FIRST_NAME: z.string().min(1),
    SEED_LAST_NAME: z.string().min(1),
    SEED_PASSWORD: z.string().min(1),
    DATABASE_HOST: z.string().min(1),
    DATABASE_PORT: z.coerce.number().int().positive(),
    DATABASE_USER: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    DATABASE_SSL: z
      .string()
      .transform((v) => v === "true")
      .pipe(z.boolean()),
    AUTH_SECRET: z.string().min(1),
    AUTH_BASE_URL: z.url(),
  })
  .parse(process.env);

const { db, pool } = makeDbAdapter({
  host: input.DATABASE_HOST,
  port: input.DATABASE_PORT,
  user: input.DATABASE_USER,
  password: input.DATABASE_PASSWORD,
  name: input.DATABASE_NAME,
  ssl: input.DATABASE_SSL,
});

const auth = makeServerAuth({
  secret: input.AUTH_SECRET,
  pool,
  baseUrl: input.AUTH_BASE_URL,
});

logger.info({ email: input.SEED_EMAIL }, `creating admin user`);

await auth.api.createUser({
  body: {
    email: input.SEED_EMAIL,
    name: `${input.SEED_FIRST_NAME} ${input.SEED_LAST_NAME}`,
    password: input.SEED_PASSWORD,
    role: "admin",
    data: {
      firstName: input.SEED_FIRST_NAME,
      lastName: input.SEED_LAST_NAME,
    },
  },
});

logger.info(`created admin user`);

await pool.end();
