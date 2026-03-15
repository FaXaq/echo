import { makeServerAuth } from "@echo/auth";
import { pool, db } from "./db";
import { cliConfig } from "../config/index";

export const auth = makeServerAuth({
  secret: cliConfig.auth.secret,
  pool,
  baseUrl: cliConfig.auth.baseUrl,
});
