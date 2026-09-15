import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import type { ClearSongFileRoleCommandPort } from "@echo/modules/drive/infrastructure";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { clearSongAudioVersion } from "./clear-song-audio-version.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

const baseInput = { songId: "song-1", fileId: "file-1" };

describe("clearSongAudioVersion", () => {
  it("throws ForbiddenError when the user lacks drive:update", async () => {
    await expect(
      clearSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
          clearSongFileRoleCommand: async () => true,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file isn't linked to this song", async () => {
    await expect(
      clearSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: true,
            error: null,
            role: null,
          }),
          clearSongFileRoleCommand: async () => false,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("clears the role on success", async () => {
    const calls: { songId: string; fileId: string }[] = [];
    const clearSongFileRoleCommand: ClearSongFileRoleCommandPort = async (_db, _scope, input) => {
      calls.push(input);
      return true;
    };

    await clearSongAudioVersion(
      {
        db,
        userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
        clearSongFileRoleCommand,
      },
      { ...baseInput, scope },
    );

    expect(calls).toEqual([{ songId: "song-1", fileId: "file-1" }]);
  });
});
