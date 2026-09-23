import type { UpdateOutreachCardDescriptionCommandPortFactory } from "./update-outreach-card-description.command.port.js";
import { makeSelectOutreachCardByIdQuery } from "./common.js";
import { toOutreachCard } from "./map-outreach.js";

export const updateOutreachCardDescriptionCommandFactory: UpdateOutreachCardDescriptionCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("outreach_card")
        .set({ description: input.description, updated_by: input.userId, updated_at: new Date() })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) return undefined;

      const row = await makeSelectOutreachCardByIdQuery(trx)(scope, updated.id);
      return toOutreachCard(row);
    });
  };
