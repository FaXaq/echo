import { createContext, useContext, type ReactNode } from "react";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { getEventQueryOptions } from "@/services/resources/calendar";
import { kindForMimeType, mimeTypeForFile, type FileKind } from "@echo/modules/drive/domain";
import { uploadFileMutationKey, type UploadFileInput } from "@/services/resources/drive";
import {
  formatUploadDestination,
  useUploadFile,
} from "@/components/features/drive/use-upload-file";

type UploadMutation = ReturnType<typeof useUploadFile>;

// Falls back to a local mutation outside EventUploadProvider (e.g. component
// tests rendered in isolation) rather than requiring every consumer to be wrapped.
const EventUploadContext = createContext<UploadMutation | null>(null);

export function EventUploadProvider({ children }: { children: ReactNode }) {
  const mutation = useUploadFile();
  return <EventUploadContext.Provider value={mutation}>{children}</EventUploadContext.Provider>;
}

export function useEventDestinationLabel(eventId: string, organizationId: string) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  return () => {
    const title = queryClient.getQueryData(
      getEventQueryOptions({ eventId, organizationId }).queryKey,
    )?.title;
    return formatUploadDestination([t`Calendar`, title]);
  };
}

export function useEventUploadMutation() {
  const localMutation = useUploadFile();
  const sharedMutation = useContext(EventUploadContext);
  return sharedMutation ?? localMutation;
}

export interface UploadingFile {
  key: number;
  filename: string;
  sizeBytes: number;
  kind: FileKind | null;
}

function isUploadFileInput(value: unknown): value is UploadFileInput {
  return typeof value === "object" && value !== null && "file" in value;
}

export function useEventUploadingFiles(eventId: string) {
  return useMutationState({
    filters: { mutationKey: uploadFileMutationKey, status: "pending" },
    select: (mutation): UploadingFile | null => {
      if (
        !isUploadFileInput(mutation.state.variables) ||
        mutation.state.variables.eventId !== eventId
      )
        return null;
      return {
        key: mutation.mutationId,
        filename: mutation.state.variables.file.name,
        sizeBytes: mutation.state.variables.file.size,
        kind: kindForMimeType(mimeTypeForFile(mutation.state.variables.file)),
      };
    },
  }).filter((file): file is UploadingFile => file !== null);
}
