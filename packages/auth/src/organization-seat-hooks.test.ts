import { describe, expect, it } from "vitest";
import { APIError } from "better-auth/api";
import { makeOrganizationSeatHooks } from "./organization-seat-hooks";

const FREE_PLAN_SEATS = 3;

function makeFakeHasSeatAvailable(state: { members: number; pendingInvitationIds: string[] }) {
  return async (organizationId: string, excludeInvitationId?: string) => {
    const pending = state.pendingInvitationIds.filter((id) => id !== excludeInvitationId);
    const used = state.members + pending.length;
    return used < FREE_PLAN_SEATS;
  };
}

describe("makeOrganizationSeatHooks", () => {
  describe("beforeAcceptInvitation", () => {
    it("was blocking the last seat before the fix (used counted the invitation being accepted)", async () => {
      const state = { members: 2, pendingInvitationIds: ["inv-3"] };
      const usedWithoutExclusion = state.members + state.pendingInvitationIds.length;
      expect(usedWithoutExclusion).toBe(FREE_PLAN_SEATS);
      expect(usedWithoutExclusion < FREE_PLAN_SEATS).toBe(false);
    });

    it("accepts the last invitation once it is excluded from its own seat count", async () => {
      const state = { members: 2, pendingInvitationIds: ["inv-3"] };
      const hooks = makeOrganizationSeatHooks(makeFakeHasSeatAvailable(state));

      await expect(
        hooks.beforeAcceptInvitation({
          organization: { id: "org-1" },
          invitation: { id: "inv-3" },
        }),
      ).resolves.toBeUndefined();
    });

    it("still rejects when the org is genuinely full without the accepting invitation", async () => {
      const state = { members: 3, pendingInvitationIds: ["inv-4"] };
      const hooks = makeOrganizationSeatHooks(makeFakeHasSeatAvailable(state));

      await expect(
        hooks.beforeAcceptInvitation({
          organization: { id: "org-1" },
          invitation: { id: "inv-4" },
        }),
      ).rejects.toBeInstanceOf(APIError);
    });

    it("passes the invitation id being accepted to hasSeatAvailable", async () => {
      const seen: { organizationId: string; excludeInvitationId?: string }[] = [];
      const hooks = makeOrganizationSeatHooks(async (organizationId, excludeInvitationId) => {
        seen.push({ organizationId, excludeInvitationId });
        return true;
      });

      await hooks.beforeAcceptInvitation({
        organization: { id: "org-1" },
        invitation: { id: "inv-3" },
      });

      expect(seen).toEqual([{ organizationId: "org-1", excludeInvitationId: "inv-3" }]);
    });
  });

  describe("beforeCreateInvitation", () => {
    it("counts everything, since the new invitation does not exist yet", async () => {
      const seen: { organizationId: string; excludeInvitationId?: string }[] = [];
      const hooks = makeOrganizationSeatHooks(async (organizationId, excludeInvitationId) => {
        seen.push({ organizationId, excludeInvitationId });
        return true;
      });

      await hooks.beforeCreateInvitation({ organization: { id: "org-1" } });

      expect(seen).toEqual([{ organizationId: "org-1", excludeInvitationId: undefined }]);
    });

    it("rejects creating an invitation when seats are already full", async () => {
      const state = { members: 3, pendingInvitationIds: [] };
      const hooks = makeOrganizationSeatHooks(makeFakeHasSeatAvailable(state));

      await expect(
        hooks.beforeCreateInvitation({ organization: { id: "org-1" } }),
      ).rejects.toBeInstanceOf(APIError);
    });
  });
});
