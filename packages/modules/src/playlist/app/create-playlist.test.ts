import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { InsertPlaylistCommandPort } from "../infrastructure/insert-playlist.command.port.js";
import { createPlaylist } from "./create-playlist.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakePlaylist } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("createPlaylist", () => {
  it("rejects a member without playlist:create permission", async () => {
    const insertPlaylistCommand: InsertPlaylistCommandPort = async () => makeFakePlaylist();

    await expect(
      createPlaylist(
        {
          db: makeFakeDb(),
          insertPlaylistCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, userId: "user-1", title: "Summer Rehearsal", description: null },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("inserts the playlist when permission succeeds", async () => {
    const inserted: unknown[] = [];
    const insertPlaylistCommand: InsertPlaylistCommandPort = async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakePlaylist({ title: input.title, description: input.description });
    };

    const result = await createPlaylist(
      { db: makeFakeDb(), insertPlaylistCommand, ...makeFakePermissionChecks() },
      { scope, userId: "user-1", title: "Summer Rehearsal", description: "For the July gigs" },
    );

    expect(inserted).toEqual([
      {
        id: expect.any(String),
        userId: "user-1",
        title: "Summer Rehearsal",
        description: "For the July gigs",
      },
    ]);
    expect(result.title).toBe("Summer Rehearsal");
  });
});
