import type { DriveLocation, Place } from "@echo/modules/drive/domain";

export function driveLocationLink(projectSlug: string, location: DriveLocation) {
  switch (location.kind) {
    case "root":
      return { to: "/projects/$projectSlug/drive", params: { projectSlug } } as const;
    case "folder":
      return {
        to: "/projects/$projectSlug/drive/$folderId",
        params: { projectSlug, folderId: location.id },
      } as const;
    case "events":
      return { to: "/projects/$projectSlug/drive/events", params: { projectSlug } } as const;
    case "songs":
      return { to: "/projects/$projectSlug/drive/songs", params: { projectSlug } } as const;
    case "event":
      return {
        to: "/projects/$projectSlug/drive/events/$eventId",
        params: { projectSlug, eventId: location.id },
      } as const;
    case "song":
      return {
        to: "/projects/$projectSlug/drive/songs/$songId",
        params: { projectSlug, songId: location.id },
      } as const;
  }
}

export function locationPlace(location: DriveLocation): Place | null {
  return location.kind === "events" || location.kind === "songs" ? null : location;
}

export function locationKey(location: DriveLocation) {
  return "id" in location ? `${location.kind}:${location.id}` : location.kind;
}

export function canCreateFolderAt(location: DriveLocation) {
  return location.kind === "root" || location.kind === "folder";
}

export function resolveUploadPlace(
  location: DriveLocation,
  targetFolder: { id: string } | null,
): Place | null {
  return targetFolder ? { kind: "folder", id: targetFolder.id } : locationPlace(location);
}
