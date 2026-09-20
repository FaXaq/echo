import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { ListOutreachColumnsQueryPort } from "../infrastructure/list-outreach-columns.query.port.js";
import type { SeedDefaultOutreachColumnsCommandPort } from "../infrastructure/seed-default-outreach-columns.command.port.js";
import { listOutreachColumns } from "./list-outreach-columns.js";
import { makeFakeDb, makeFakeOutreachColumn, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("listOutreachColumns", () => {
  it("rejects a member without outreach:read permission", async () => {
    const listOutreachColumnsQuery: ListOutreachColumnsQueryPort = async () => [];
    const seedDefaultOutreachColumnsCommand: SeedDefaultOutreachColumnsCommandPort = async () => [];

    await expect(
      listOutreachColumns(
        {
          db: makeFakeDb(),
          listOutreachColumnsQuery,
          seedDefaultOutreachColumnsCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns existing columns without seeding when some already exist", async () => {
    const existing = [makeFakeOutreachColumn()];
    const listOutreachColumnsQuery: ListOutreachColumnsQueryPort = async () => existing;
    let seedCalled = false;
    const seedDefaultOutreachColumnsCommand: SeedDefaultOutreachColumnsCommandPort = async () => {
      seedCalled = true;
      return [];
    };

    const result = await listOutreachColumns(
      {
        db: makeFakeDb(),
        listOutreachColumnsQuery,
        seedDefaultOutreachColumnsCommand,
        ...makeFakePermissionChecks(),
      },
      { scope },
    );

    expect(result).toEqual(existing);
    expect(seedCalled).toBe(false);
  });

  it("seeds the default columns when the board has none yet", async () => {
    const listOutreachColumnsQuery: ListOutreachColumnsQueryPort = async () => [];
    const seeded = [makeFakeOutreachColumn({ name: "À contacter" })];
    const seedDefaultOutreachColumnsCommand: SeedDefaultOutreachColumnsCommandPort = async () =>
      seeded;

    const result = await listOutreachColumns(
      {
        db: makeFakeDb(),
        listOutreachColumnsQuery,
        seedDefaultOutreachColumnsCommand,
        ...makeFakePermissionChecks(),
      },
      { scope },
    );

    expect(result).toEqual(seeded);
  });
});
