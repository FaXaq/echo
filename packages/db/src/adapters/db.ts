import { Kysely } from "kysely";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB } from "../schema";

export type DBConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  ssl?: boolean;
}

export const makeDbAdapter = (config: DBConfig) => {
  const pool = new Pool({
    database: config.name,
    host: config.host,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false
  })

  const dialect = new PostgresDialect({
    pool
  })

  const db = new Kysely<DB>({
    dialect
  })

  return { pool, db, dialect }
}
