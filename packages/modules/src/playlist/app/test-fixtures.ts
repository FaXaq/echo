import { makeDbAdapter, type KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Playlist } from "../domain/index.js";
import type { GetPlaylistByIdQueryPort } from "../infrastructure/get-playlist-by-id.query.port.js";

export function makeFakeDb(): KyselyDB {
  return makeDbAdapter({
    host: "localhost",
    port: 5432,
    user: "test",
    password: "test",
    name: "test",
  }).db;
}

export function makeFakePermissionChecks(
  overrides: Partial<{ userHasPermissionInOrganization: CheckOrganizationPermission }> = {},
): { userHasPermissionInOrganization: CheckOrganizationPermission } {
  return {
    userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
    ...overrides,
  };
}

export function makeFakePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: "playlist-1",
    title: "Summer Rehearsal",
    description: null,
    organization: { id: "org-1", name: "The Band", slug: "the-band" },
    createdAt: new Date("2026-01-01"),
    createdBy: "user-1",
    createdByName: "Test User",
    updatedBy: null,
    updatedAt: null,
    ...overrides,
  };
}

export function makeFakeGetPlaylistById(
  record: Playlist | null = makeFakePlaylist(),
): GetPlaylistByIdQueryPort {
  return async () => record ?? undefined;
}
