import type { DB } from "@echo/db";
import type { Selectable } from "kysely";
import type { Contact } from "../domain/index.js";

export type ContactRow = Selectable<DB["contact"]>;

export function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    description: row.description,
  };
}
