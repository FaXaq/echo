import type { InsertOutreachCardCommandPortFactory } from "./insert-outreach-card.command.port.js";
import { makeSelectOutreachCardByIdQuery } from "./common.js";
import { toOutreachCard } from "./map-outreach.js";

export const insertOutreachCardCommandFactory: InsertOutreachCardCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      let values = trx
        .selectNoFrom((eb) => [
          eb.val(input.id).as("id"),
          eb.val(scope.organizationId).as("organization_id"),
          eb.val(input.columnId).as("column_id"),
          eb.val(input.position).as("position"),
          eb.val(input.title).as("title"),
          eb.val(input.place?.name ?? null).as("place_name"),
          eb.val(input.place?.address ?? null).as("place_address"),
          eb.val(input.place?.lat ?? null).as("place_lat"),
          eb.val(input.place?.lng ?? null).as("place_lng"),
          eb.val(input.description).as("description"),
          eb.val(input.assigneeId).as("assignee_id"),
          eb.val(input.userId).as("created_by"),
          eb.val(input.userId).as("updated_by"),
        ])
        .where((eb) =>
          eb.exists(
            trx
              .selectFrom("outreach_column")
              .select("id")
              .where("id", "=", input.columnId)
              .where("organization_id", "=", scope.organizationId),
          ),
        );

      if (input.assigneeId !== null) {
        const assigneeId = input.assigneeId;
        values = values.where((eb) =>
          eb.exists(
            trx
              .selectFrom("member")
              .select("id")
              .where("userId", "=", assigneeId)
              .where("organizationId", "=", scope.organizationId),
          ),
        );
      }

      const inserted = await trx
        .insertInto("outreach_card")
        .columns([
          "id",
          "organization_id",
          "column_id",
          "position",
          "title",
          "place_name",
          "place_address",
          "place_lat",
          "place_lng",
          "description",
          "assignee_id",
          "created_by",
          "updated_by",
        ])
        .expression(values)
        .returning("id")
        .executeTakeFirst();

      if (!inserted) return undefined;

      const row = await makeSelectOutreachCardByIdQuery(trx)(scope, inserted.id);
      return toOutreachCard(row);
    });
  };
