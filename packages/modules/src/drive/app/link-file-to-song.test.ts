import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { linkFileToSong } from "./link-file-to-song.js";
import {
  makeFakeDb,
  makeFakeFindFileById,
  makeFakeLinkFileToSong,
  makeFakePermissionChecks,
  makeFakeSongExistsInOrganization,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const input = { fileId: "file-1", songId: "song-1", userId: "user-1", scope };

function makeDeps(overrides: Partial<Parameters<typeof linkFileToSong>[0]> = {}) {
  return {
    db: makeFakeDb(),
    findFileByIdQuery: makeFakeFindFileById(),
    songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
    linkFileToSongCommand: makeFakeLinkFileToSong(),
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

describe("linkFileToSong", () => {
  it("rejects a member without drive:update permission", async () => {
    const deps = makeDeps(
      makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    );
    await expect(linkFileToSong(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file isn't in this organization", async () => {
    const deps = makeDeps({ findFileByIdQuery: makeFakeFindFileById(null) });
    await expect(linkFileToSong(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the song isn't in this organization", async () => {
    const deps = makeDeps({
      songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(false),
    });
    await expect(linkFileToSong(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("links the file to the song", async () => {
    const onLink = vi.fn();
    await linkFileToSong(
      makeDeps({ linkFileToSongCommand: makeFakeLinkFileToSong(onLink) }),
      input,
    );
    expect(onLink).toHaveBeenCalledWith("song-1", "file-1");
  });
});
