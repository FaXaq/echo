import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { InsertOccurrencesCommandPort } from "../infrastructure/index.js";
import { addOccurrences } from "./add-occurrences.js";
import {
  makeFakeDb,
  makeFakeEventExistsInOrganization,
  makeFakeFileRecord,
  makeFakeFindFolderById,
  makeFakePermissionChecks,
  makeFakeSongExistsInOrganization,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

function makeDeps(
  overrides: Partial<Parameters<typeof addOccurrences>[0]> = {},
  onInsert?: (input: Parameters<InsertOccurrencesCommandPort>[2]) => void,
) {
  return {
    db: makeFakeDb(),
    findFilesByIdsQuery: async (_db: unknown, _scope: unknown, input: { ids: string[] }) =>
      input.ids.map((id) => makeFakeFileRecord({ id })),
    findFolderByIdQuery: makeFakeFindFolderById(),
    eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
    songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
    insertOccurrencesCommand: (async (_db, _scope, input) => {
      onInsert?.(input);
    }) satisfies InsertOccurrencesCommandPort,
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

const input = {
  fileIds: ["file-1", "file-2"],
  place: { kind: "event", id: "event-1" } as const,
  userId: "user-1",
  scope,
};

describe("addOccurrences", () => {
  it("rejects a member without drive:update permission", async () => {
    const deps = makeDeps(
      makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    );
    await expect(addOccurrences(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a foreign event", async () => {
    const deps = makeDeps({
      eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(false),
    });
    await expect(addOccurrences(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when a file is not in the organization", async () => {
    const deps = makeDeps({
      findFilesByIdsQuery: async () => [makeFakeFileRecord({ id: "file-1" })],
    });
    await expect(addOccurrences(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("inserts one occurrence per file", async () => {
    const inserted: Parameters<InsertOccurrencesCommandPort>[2][] = [];
    await addOccurrences(
      makeDeps({}, (command) => inserted.push(command)),
      { ...input, fileIds: ["file-1", "file-2", "file-1"] },
    );
    expect(inserted).toEqual([
      { fileIds: ["file-1", "file-2"], place: input.place, addedBy: "user-1" },
    ]);
  });
});
