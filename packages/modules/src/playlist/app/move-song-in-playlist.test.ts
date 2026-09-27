import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSongEntry } from "../domain/index.js";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";
import type { MoveSongInPlaylistCommandPort } from "../infrastructure/move-song-in-playlist.command.port.js";
import { moveSongInPlaylist } from "./move-song-in-playlist.js";
import { makeFakeDb, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

const songs: PlaylistSongEntry[] = [
  { songId: "song-a", title: "A", artist: null, position: 0 },
  { songId: "song-b", title: "B", artist: null, position: 1 },
  { songId: "song-c", title: "C", artist: null, position: 2 },
];

describe("moveSongInPlaylist", () => {
  it("rejects a member without playlist:update permission", async () => {
    const listPlaylistSongsQuery: ListPlaylistSongsQueryPort = async () => songs;
    const moveSongInPlaylistCommand: MoveSongInPlaylistCommandPort = async () => true;

    await expect(
      moveSongInPlaylist(
        {
          db: makeFakeDb(),
          listPlaylistSongsQuery,
          moveSongInPlaylistCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        {
          scope,
          playlistId: "playlist-1",
          songId: "song-c",
          beforeId: "song-a",
          afterId: "song-b",
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("computes the midpoint position between the two neighbors", async () => {
    const listPlaylistSongsQuery: ListPlaylistSongsQueryPort = async () => songs;
    const moved: unknown[] = [];
    const moveSongInPlaylistCommand: MoveSongInPlaylistCommandPort = async (_db, _scope, input) => {
      moved.push(input);
      return true;
    };

    await moveSongInPlaylist(
      {
        db: makeFakeDb(),
        listPlaylistSongsQuery,
        moveSongInPlaylistCommand,
        ...makeFakePermissionChecks(),
      },
      { scope, playlistId: "playlist-1", songId: "song-c", beforeId: "song-a", afterId: "song-b" },
    );

    expect(moved).toEqual([{ playlistId: "playlist-1", songId: "song-c", position: 0.5 }]);
  });

  it("throws NotFoundError when the command finds no matching row", async () => {
    const listPlaylistSongsQuery: ListPlaylistSongsQueryPort = async () => songs;
    const moveSongInPlaylistCommand: MoveSongInPlaylistCommandPort = async () => false;

    await expect(
      moveSongInPlaylist(
        {
          db: makeFakeDb(),
          listPlaylistSongsQuery,
          moveSongInPlaylistCommand,
          ...makeFakePermissionChecks(),
        },
        { scope, playlistId: "playlist-1", songId: "song-z", beforeId: null, afterId: null },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
