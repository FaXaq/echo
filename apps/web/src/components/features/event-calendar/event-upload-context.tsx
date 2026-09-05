import { createContext, useContext, type ReactNode } from "react";
import { useMutationState } from "@tanstack/react-query";
import { kindForMimeType, type FileKind } from "@echo/modules/drive/domain";
import {
  uploadFileMutationKey,
  useUploadFileMutation,
  type UploadFileInput,
} from "@/services/resources/drive";

type UploadMutation = ReturnType<typeof useUploadFileMutation>;

// Falls back to a local mutation outside EventUploadProvider (e.g. component
// tests rendered in isolation) rather than requiring every consumer to be wrapped.
const EventUploadContext = createContext<UploadMutation | null>(null);

export function EventUploadProvider({ children }: { children: ReactNode }) {
  const mutation = useUploadFileMutation();
  return <EventUploadContext.Provider value={mutation}>{children}</EventUploadContext.Provider>;
}

export function useEventUploadMutation() {
  const localMutation = useUploadFileMutation();
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
        kind: kindForMimeType(mutation.state.variables.file.type),
      };
    },
  }).filter((file): file is UploadingFile => file !== null);
}
