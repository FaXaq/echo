import { describe, expect, it } from "vitest";
import { DataValidationFailedError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { UpdateRepaymentCommandPort } from "../infrastructure/update-repayment.command.port.js";
import { updateRepayment } from "./update-repayment.js";
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
  amountMinor: 2500,
  paidOn: "2026-10-02",
  note: "cash",
};

function makeDeps(overrides: Partial<Parameters<typeof updateRepayment>[0]> = {}) {
  const updated: Parameters<UpdateRepaymentCommandPort>[2][] = [];
  const deps = {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    getRepaymentByIdQuery: async () => makeFakeRepayment(),
    updateRepaymentCommand: (async (_db, _scope, input) => {
      updated.push(input);
      return makeFakeRepayment({ amountMinor: input.amountMinor });
    }) satisfies UpdateRepaymentCommandPort,
    listOrganizationMemberIdsQuery: async () => ["marie"],
    ...overrides,
  };
  return { deps, updated };
}

describe("updateRepayment", () => {
  it("rejects a member without expense:update permission", async () => {
    const { deps } = makeDeps(deniedPermissionChecks);

    await expect(updateRepayment(deps, { scope, id: "repayment-1", draft })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("is not found when the repayment does not exist", async () => {
    const { deps } = makeDeps({ getRepaymentByIdQuery: async () => undefined });

    await expect(updateRepayment(deps, { scope, id: "nope", draft })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("lets a former member stay on a repayment they were already on", async () => {
    const { deps, updated } = makeDeps();

    await updateRepayment(deps, { scope, id: "repayment-1", draft });

    expect(updated).toEqual([{ id: "repayment-1", ...draft }]);
  });

  it("still rejects switching to a different non-member", async () => {
    const { deps } = makeDeps();

    await expect(
      updateRepayment(deps, {
        scope,
        id: "repayment-1",
        draft: { ...draft, fromUserId: "stranger" },
      }),
    ).rejects.toBeInstanceOf(DataValidationFailedError);
  });
});
