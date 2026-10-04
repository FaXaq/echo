import { describe, expect, it } from "vitest";
import { DataValidationFailedError, ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { InsertRepaymentCommandPort } from "../infrastructure/insert-repayment.command.port.js";
import { createRepayment } from "./create-repayment.js";
import {
  deniedPermissionChecks,
  makeFakeDb,
  makeFakePermissionChecks,
  makeFakeRepayment,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

const draft = {
  fromUserId: "paul",
  toUserId: "marie",
  amountMinor: 2000,
  paidOn: "2026-10-02",
  note: null,
};

function makeDeps(overrides: Partial<Parameters<typeof createRepayment>[0]> = {}) {
  const inserted: Parameters<InsertRepaymentCommandPort>[2][] = [];
  const deps = {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    insertRepaymentCommand: (async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakeRepayment();
    }) satisfies InsertRepaymentCommandPort,
    listOrganizationMemberIdsQuery: async () => ["marie", "paul"],
    ...overrides,
  };
  return { deps, inserted };
}

describe("createRepayment", () => {
  it("rejects a member without expense:create permission", async () => {
    const { deps } = makeDeps(deniedPermissionChecks);

    await expect(createRepayment(deps, { scope, userId: "paul", draft })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("inserts a valid repayment", async () => {
    const { deps, inserted } = makeDeps();

    await createRepayment(deps, { scope, userId: "paul", draft });

    expect(inserted).toEqual([{ id: expect.any(String), userId: "paul", ...draft }]);
  });

  it("rejects paying yourself", async () => {
    const { deps } = makeDeps();

    await expect(
      createRepayment(deps, { scope, userId: "paul", draft: { ...draft, toUserId: "paul" } }),
    ).rejects.toBeInstanceOf(DataValidationFailedError);
  });

  it("rejects non-positive, fractional and oversized amounts", async () => {
    const { deps } = makeDeps();

    for (const amountMinor of [0, -1, 1.5, 2_000_000_001]) {
      await expect(
        createRepayment(deps, { scope, userId: "paul", draft: { ...draft, amountMinor } }),
      ).rejects.toBeInstanceOf(DataValidationFailedError);
    }
  });

  it("rejects a party who is not a member", async () => {
    const { deps } = makeDeps({ listOrganizationMemberIdsQuery: async () => ["marie"] });

    await expect(createRepayment(deps, { scope, userId: "paul", draft })).rejects.toBeInstanceOf(
      DataValidationFailedError,
    );
  });
});
