import { describe, expect, it } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { CountOutreachCardsInColumnQueryPort } from "../infrastructure/count-outreach-cards-in-column.query.port.js";
import type { DeleteOutreachColumnCommandPort } from "../infrastructure/delete-outreach-column.command.port.js";
import { deleteOutreachColumn } from "./delete-outreach-column.js";
import { makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("deleteOutreachColumn", () => {
  it("rejects a member without outreach:delete permission", async () => {
    const countOutreachCardsInColumnQuery: CountOutreachCardsInColumnQueryPort = async () => 0;
    const deleteOutreachColumnCommand: DeleteOutreachColumnCommandPort = async () => true;

    await expect(
      deleteOutreachColumn(
        {
          db: makeFakeDb(),
          countOutreachCardsInColumnQuery,
          deleteOutreachColumnCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, id: "column-1" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses to delete a column that still holds cards", async () => {
    const countOutreachCardsInColumnQuery: CountOutreachCardsInColumnQueryPort = async () => 2;
    const deleteOutreachColumnCommand: DeleteOutreachColumnCommandPort = async () => true;

    await expect(
      deleteOutreachColumn(
        {
          db: makeFakeDb(),
          countOutreachCardsInColumnQuery,
          deleteOutreachColumnCommand,
          ...makeFakePermissionChecks(),
        },
        { scope, id: "column-1" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws not found when the column doesn't exist in this organization", async () => {
    const countOutreachCardsInColumnQuery: CountOutreachCardsInColumnQueryPort = async () => 0;
    const deleteOutreachColumnCommand: DeleteOutreachColumnCommandPort = async () => false;

    await expect(
      deleteOutreachColumn(
        {
          db: makeFakeDb(),
          countOutreachCardsInColumnQuery,
          deleteOutreachColumnCommand,
          ...makeFakePermissionChecks(),
        },
        { scope, id: "column-1" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes an empty column", async () => {
    const countOutreachCardsInColumnQuery: CountOutreachCardsInColumnQueryPort = async () => 0;
    let deletedId: string | undefined;
    const deleteOutreachColumnCommand: DeleteOutreachColumnCommandPort = async (
      _db,
      _scope,
      input,
    ) => {
      deletedId = input.id;
      return true;
    };

    await deleteOutreachColumn(
      {
        db: makeFakeDb(),
        countOutreachCardsInColumnQuery,
        deleteOutreachColumnCommand,
        ...makeFakePermissionChecks(),
      },
      { scope, id: "column-1" },
    );

    expect(deletedId).toBe("column-1");
  });
});
