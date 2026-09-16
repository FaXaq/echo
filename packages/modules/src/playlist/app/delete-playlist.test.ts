import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { DeletePlaylistCommandPort } from "../infrastructure/delete-playlist.command.port.js";
import { deletePlaylist } from "./delete-playlist.js";
import { makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("deletePlaylist", () => {
  it("rejects a member without playlist:delete permission", async () => {
    const deletePlaylistCommand: DeletePlaylistCommandPort = async () => true;

    await expect(
      deletePlaylist(
        {
          db: makeFakeDb(),
          deletePlaylistCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "playlist-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the playlist doesn't exist in this organization", async () => {
    const deletePlaylistCommand: DeletePlaylistCommandPort = async () => false;

    await expect(
      deletePlaylist(
        { db: makeFakeDb(), deletePlaylistCommand, ...makeFakePermissionChecks() },
        { id: "playlist-1", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes the playlist when permission succeeds and it exists", async () => {
    const deletePlaylistCommand: DeletePlaylistCommandPort = async () => true;

    await expect(
      deletePlaylist(
        { db: makeFakeDb(), deletePlaylistCommand, ...makeFakePermissionChecks() },
        { id: "playlist-1", scope },
      ),
    ).resolves.toBeUndefined();
  });
});
