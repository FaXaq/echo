import { makeDbAdapter } from "@echo/db";
import { cliConfig } from "../config/index";

const { db, pool } = makeDbAdapter(cliConfig.db);

export { db, pool };
