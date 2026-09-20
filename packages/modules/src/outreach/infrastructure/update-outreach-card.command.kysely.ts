import type { UpdateOutreachCardCommandPortFactory } from "./update-outreach-card.command.port.js";
import { makeSelectOutreachCardByIdQuery } from "./common.js";
import { toOutreachCard } from "./map-outreach.js";

export const updateOutreachCardCommandFactory: UpdateOutreachCardCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("outreach_card")
        .set({
          title: input.title,
          place_name: input.place?.name ?? null,
          place_address: input.place?.address ?? null,
          place_lat: input.place?.lat ?? null,
          place_lng: input.place?.lng ?? null,
          description: input.description,
          assignee_id: input.assigneeId,
          updated_by: input.userId,
          updated_at: new Date(),
        })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();

      if (!updated) return undefined;

      const row = await makeSelectOutreachCardByIdQuery(trx)(scope, updated.id);
      return toOutreachCard(row);
    });
  };
