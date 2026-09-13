import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { getPlaylistById } from "./get-playlist-by-id.js";
import { makeFakeDb, makeFakeGetPlaylistById, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("getPlaylistById", () => {
  it("rejects a member without playlist:read permission", async () => {
    await expect(
      getPlaylistById(
        {
          db: makeFakeDb(),
          getPlaylistByIdQuery: makeFakeGetPlaylistById(),
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { playlistId: "playlist-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the playlist doesn't exist in this organization", async () => {
    await expect(
      getPlaylistById(
        {
          db: makeFakeDb(),
          getPlaylistByIdQuery: makeFakeGetPlaylistById(null),
          ...makeFakePermissionChecks(),
        },
        { playlistId: "playlist-1", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the playlist when permission succeeds and it exists", async () => {
    const result = await getPlaylistById(
      {
        db: makeFakeDb(),
        getPlaylistByIdQuery: makeFakeGetPlaylistById(),
        ...makeFakePermissionChecks(),
      },
      { playlistId: "playlist-1", scope },
    );

    expect(result.id).toBe("playlist-1");
  });
});
