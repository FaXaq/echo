import type { DB } from "@echo/db";
import type { Selectable } from "kysely";
import type { OutreachCard, OutreachColumn, OutreachPlace } from "../domain/index.js";

export type OutreachColumnRow = Selectable<DB["outreach_column"]>;

export function toOutreachColumn(row: OutreachColumnRow): OutreachColumn {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    position: row.position,
  };
}

export type OutreachCardRow = Selectable<DB["outreach_card"]> & { assignee_name: string | null };

function toOutreachPlace(row: OutreachCardRow): OutreachPlace | null {
  if (
    row.place_name === null ||
    row.place_address === null ||
    row.place_lat === null ||
    row.place_lng === null
  ) {
    return null;
  }

  return {
    name: row.place_name,
    address: row.place_address,
    lat: row.place_lat,
    lng: row.place_lng,
  };
}

export function toOutreachCard(row: OutreachCardRow): OutreachCard {
  return {
    id: row.id,
    organizationId: row.organization_id,
    columnId: row.column_id,
    title: row.title,
    position: row.position,
    place: toOutreachPlace(row),
    description: row.description,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
