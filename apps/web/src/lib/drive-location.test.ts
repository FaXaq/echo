import { describe, expect, it } from "vitest";
import {
  canCreateFolderAt,
  driveLocationLink,
  locationKey,
  locationPlace,
  resolveUploadPlace,
} from "./drive-location";

describe("driveLocationLink", () => {
  it("links every location kind to its route", () => {
    expect(driveLocationLink("acme", { kind: "root" })).toEqual({
      to: "/projects/$projectSlug/drive",
      params: { projectSlug: "acme" },
    });
    expect(driveLocationLink("acme", { kind: "folder", id: "f1" })).toEqual({
      to: "/projects/$projectSlug/drive/$folderId",
      params: { projectSlug: "acme", folderId: "f1" },
    });
    expect(driveLocationLink("acme", { kind: "events" })).toEqual({
      to: "/projects/$projectSlug/drive/events",
      params: { projectSlug: "acme" },
    });
    expect(driveLocationLink("acme", { kind: "songs" })).toEqual({
      to: "/projects/$projectSlug/drive/songs",
      params: { projectSlug: "acme" },
    });
    expect(driveLocationLink("acme", { kind: "event", id: "e1" })).toEqual({
      to: "/projects/$projectSlug/drive/events/$eventId",
      params: { projectSlug: "acme", eventId: "e1" },
    });
    expect(driveLocationLink("acme", { kind: "song", id: "s1" })).toEqual({
      to: "/projects/$projectSlug/drive/songs/$songId",
      params: { projectSlug: "acme", songId: "s1" },
    });
  });
});

describe("locationPlace", () => {
  it("is null in the Events and Songs roots", () => {
    expect(locationPlace({ kind: "events" })).toBeNull();
    expect(locationPlace({ kind: "songs" })).toBeNull();
  });

  it("is the location itself everywhere else", () => {
    expect(locationPlace({ kind: "root" })).toEqual({ kind: "root" });
    expect(locationPlace({ kind: "event", id: "e1" })).toEqual({ kind: "event", id: "e1" });
  });
});

describe("locationKey", () => {
  it("distinguishes locations by kind and id", () => {
    expect(locationKey({ kind: "root" })).toBe("root");
    expect(locationKey({ kind: "events" })).toBe("events");
    expect(locationKey({ kind: "folder", id: "a" })).toBe("folder:a");
    expect(locationKey({ kind: "folder", id: "a" })).not.toBe(
      locationKey({ kind: "event", id: "a" }),
    );
  });
});

describe("canCreateFolderAt", () => {
  it("only allows the Drive root and user folders", () => {
    expect(canCreateFolderAt({ kind: "root" })).toBe(true);
    expect(canCreateFolderAt({ kind: "folder", id: "f1" })).toBe(true);
    expect(canCreateFolderAt({ kind: "events" })).toBe(false);
    expect(canCreateFolderAt({ kind: "songs" })).toBe(false);
    expect(canCreateFolderAt({ kind: "event", id: "e1" })).toBe(false);
    expect(canCreateFolderAt({ kind: "song", id: "s1" })).toBe(false);
  });
});

describe("resolveUploadPlace", () => {
  it("targets the hovered folder when dropping onto a folder row", () => {
    expect(resolveUploadPlace({ kind: "root" }, { id: "f1" })).toEqual({
      kind: "folder",
      id: "f1",
    });
  });

  it("falls back to the current location", () => {
    expect(resolveUploadPlace({ kind: "event", id: "e1" }, null)).toEqual({
      kind: "event",
      id: "e1",
    });
  });

  it("has no place in the Events and Songs roots", () => {
    expect(resolveUploadPlace({ kind: "songs" }, null)).toBeNull();
  });
});
