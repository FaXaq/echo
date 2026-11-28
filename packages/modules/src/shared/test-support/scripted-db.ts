import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type DatabaseConnection,
} from "kysely";
import type { DB } from "@echo/db";

class ScriptedDriver extends DummyDriver {
  private readonly respond: (sql: string) => any[];

  constructor(respond: (sql: string) => any[]) {
    super();
    this.respond = respond;
  }

  override async acquireConnection(): Promise<DatabaseConnection> {
    return {
      executeQuery: async (query) => ({ rows: this.respond(query.sql), numAffectedRows: 1n }),
      streamQuery: async function* () {},
    };
  }
}

export function makeScriptedDb(respond: (sql: string) => any[] = () => []) {
  const queries: string[] = [];
  const db = new Kysely<DB>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new ScriptedDriver(respond),
      createIntrospector: (introspected) => new PostgresIntrospector(introspected),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    log: (event) => {
      queries.push(event.query.sql);
    },
  });
  return { db, queries };
}
