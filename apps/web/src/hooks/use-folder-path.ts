import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { eventFolderName, type DriveLocation } from "@echo/modules/drive/domain";
import { getEventQueryOptions } from "@/services/resources/calendar";
import {
  getDriveLocationPathQueryKey,
  getFolderPathQueryOptions,
} from "@/services/resources/drive";
import { getSongQueryOptions } from "@/services/resources/song";

type PathSegment = { name: string; location: DriveLocation };

export function useDriveLocationLabel() {
  const { t } = useLingui();
  return (location: DriveLocation, name: string) => {
    if (location.kind === "events") return t`Events`;
    if (location.kind === "songs") return t`Songs`;
    return name;
  };
}

export function useDriveLocationPath(location: DriveLocation, organizationId: string) {
  const queryClient = useQueryClient();
  const labelFor = useDriveLocationLabel();

  const { data } = useSuspenseQuery({
    queryKey: getDriveLocationPathQueryKey({ location, organizationId }),
    queryFn: async () => {
      const path: PathSegment[] = [];
      switch (location.kind) {
        case "root":
          break;
        case "folder": {
          const folders = await queryClient.fetchQuery(
            getFolderPathQueryOptions({ id: location.id, organizationId }),
          );
          path.push(
            ...folders.map(({ id, name }): PathSegment => ({
              name,
              location: { kind: "folder", id },
            })),
          );
          break;
        }
        case "events":
          path.push({ name: "Events", location });
          break;
        case "songs":
          path.push({ name: "Songs", location });
          break;
        case "event": {
          const event = await queryClient.fetchQuery(
            getEventQueryOptions({ eventId: location.id, organizationId }),
          );
          path.push(
            { name: "Events", location: { kind: "events" } },
            {
              name: eventFolderName({ title: event.title, startDate: new Date(event.startDate) }),
              location,
            },
          );
          break;
        }
        case "song": {
          const song = await queryClient.fetchQuery(
            getSongQueryOptions({ songId: location.id, organizationId }),
          );
          path.push({ name: "Songs", location: { kind: "songs" } }, { name: song.title, location });
          break;
        }
      }
      return path;
    },
  });

  return data.map((segment) => ({
    label: labelFor(segment.location, segment.name),
    location: segment.location,
  }));
}
