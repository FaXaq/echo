import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { UpdatePlaylistCommandPort } from "../infrastructure/update-playlist.command.port.js";
import { updatePlaylist } from "./update-playlist.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakePlaylist } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("updatePlaylist", () => {
  it("rejects a member without playlist:update permission", async () => {
    const updatePlaylistCommand: UpdatePlaylistCommandPort = async () => makeFakePlaylist();

    await expect(
      updatePlaylist(
        {
          db: makeFakeDb(),
          updatePlaylistCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        {
          id: "playlist-1",
          scope,
          userId: "user-1",
          title: "Summer Rehearsal",
          description: null,
          intervalSeconds: null,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the playlist doesn't exist in this organization", async () => {
    const updatePlaylistCommand: UpdatePlaylistCommandPort = async () => null;

    await expect(
      updatePlaylist(
        { db: makeFakeDb(), updatePlaylistCommand, ...makeFakePermissionChecks() },
        {
          id: "playlist-1",
          scope,
          userId: "user-1",
          title: "Summer Rehearsal",
          description: null,
          intervalSeconds: null,
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates the playlist when permission succeeds and it exists", async () => {
    const updated: unknown[] = [];
    const updatePlaylistCommand: UpdatePlaylistCommandPort = async (_db, _scope, input) => {
      updated.push(input);
      return makeFakePlaylist({ title: input.title, description: input.description });
    };

    const result = await updatePlaylist(
      { db: makeFakeDb(), updatePlaylistCommand, ...makeFakePermissionChecks() },
      {
        id: "playlist-1",
        scope,
        userId: "user-1",
        title: "Fall Rehearsal",
        description: "Updated notes",
        intervalSeconds: 5,
      },
    );

    expect(updated).toEqual([
      {
        id: "playlist-1",
        userId: "user-1",
        title: "Fall Rehearsal",
        description: "Updated notes",
        intervalSeconds: 5,
      },
    ]);
    expect(result.title).toBe("Fall Rehearsal");
  });
});
