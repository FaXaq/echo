import { createContext, useContext, type ReactNode } from "react";
import { useMutationState } from "@tanstack/react-query";
import { kindForMimeType, type FileKind } from "@echo/modules/drive/domain";
import {
  uploadFileMutationKey,
  useUploadFileMutation,
  type UploadFileInput,
} from "@/services/resources/drive";

type UploadMutation = ReturnType<typeof useUploadFileMutation>;

// Falls back to a local mutation outside SongUploadProvider (e.g. component
// tests rendered in isolation) rather than requiring every consumer to be wrapped.
const SongUploadContext = createContext<UploadMutation | null>(null);

export function SongUploadProvider({ children }: { children: ReactNode }) {
  const mutation = useUploadFileMutation();
  return <SongUploadContext.Provider value={mutation}>{children}</SongUploadContext.Provider>;
}

export function useSongUploadMutation() {
  const localMutation = useUploadFileMutation();
  const sharedMutation = useContext(SongUploadContext);
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

export function useSongUploadingFiles(songId: string) {
  return useMutationState({
    filters: { mutationKey: uploadFileMutationKey, status: "pending" },
    select: (mutation): UploadingFile | null => {
      if (
        !isUploadFileInput(mutation.state.variables) ||
        mutation.state.variables.songId !== songId
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
