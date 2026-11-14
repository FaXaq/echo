import { describe, expect, it } from "vitest";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { GetMemberBalanceQueryPort } from "../infrastructure/get-member-balance.query.port.js";
import { getMyBalance } from "./get-my-balance.js";
import { deniedPermissionChecks, makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const getOrganizationCurrencyQuery = async () => "EUR";

describe("getMyBalance", () => {
  it("returns the balance of the requesting member in the organization currency", async () => {
    const requested: string[] = [];
    const getMemberBalanceQuery: GetMemberBalanceQueryPort = async (_db, _scope, input) => {
      requested.push(input.userId);
      return -9610;
    };

    const balance = await getMyBalance(
      {
        db: makeFakeDb(),
        ...makeFakePermissionChecks(),
        getMemberBalanceQuery,
        getOrganizationCurrencyQuery,
      },
      { scope, userId: "user-1" },
    );

    expect(balance).toEqual({ amountMinor: -9610, currency: "EUR" });
    expect(requested).toEqual(["user-1"]);
  });

  it("rejects members who cannot read expenses", async () => {
    await expect(
      getMyBalance(
        {
          db: makeFakeDb(),
          ...deniedPermissionChecks,
          getMemberBalanceQuery: async () => 0,
          getOrganizationCurrencyQuery,
        },
        { scope, userId: "user-1" },
      ),
    ).rejects.toThrow();
  });
});
