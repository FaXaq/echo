import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { PlaceLabel } from "../domain/index.js";
import { listFileOccurrences } from "./list-file-occurrences.js";
import { makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const labels: Record<string, PlaceLabel[]> = { "file-1": [{ place: { kind: "root" }, path: [] }] };

describe("listFileOccurrences", () => {
  it("rejects a member without drive:read permission", async () => {
    await expect(
      listFileOccurrences(
        {
          db: makeFakeDb(),
          listFileOccurrencesQuery: async () => labels,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { fileIds: ["file-1"], scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns each file's place labels", async () => {
    await expect(
      listFileOccurrences(
        {
          db: makeFakeDb(),
          listFileOccurrencesQuery: async () => labels,
          ...makeFakePermissionChecks(),
        },
        { fileIds: ["file-1"], scope },
      ),
    ).resolves.toEqual(labels);
  });
});
