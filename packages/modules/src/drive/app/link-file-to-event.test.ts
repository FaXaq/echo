import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { linkFileToEvent } from "./link-file-to-event.js";
import {
  makeFakeDb,
  makeFakeFindFileById,
  makeFakeLinkFileToEvent,
  makeFakePermissionChecks,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const input = { fileId: "file-1", eventId: "event-1", scope };

function makeDeps(overrides: Partial<Parameters<typeof linkFileToEvent>[0]> = {}) {
  return {
    db: makeFakeDb(),
    findFileByIdQuery: makeFakeFindFileById(),
    linkFileToEventCommand: makeFakeLinkFileToEvent(),
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

describe("linkFileToEvent", () => {
  it("rejects a member without drive:update permission", async () => {
    const deps = makeDeps(
      makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    );
    await expect(linkFileToEvent(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file isn't in this organization", async () => {
    const deps = makeDeps({ findFileByIdQuery: makeFakeFindFileById(null) });
    await expect(linkFileToEvent(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the event isn't in this organization", async () => {
    const deps = makeDeps({ linkFileToEventCommand: makeFakeLinkFileToEvent(false) });
    await expect(linkFileToEvent(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("links the file to the event", async () => {
    await expect(linkFileToEvent(makeDeps(), input)).resolves.toBeUndefined();
  });
});
