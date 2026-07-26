import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("file");

export { key };

export type EventFile = RouterOutputs["file"]["listEventFiles"][number];

export function getEventFilesQueryOptions(opts: { eventId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listEventFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.file.listEventFiles.query(params, { signal });
    },
  });
}

export function useUploadFileMutation({
  onSuccess,
}: {
  onSuccess?: (file: RouterOutputs["file"]["confirmUpload"]) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { eventId?: string; organizationId?: string; file: File }) => {
      const { fileId, uploadUrl } = await apiClient.file.createUpload.mutate({
        eventId: input.eventId,
        organizationId: input.organizationId,
        mimeType: input.file.type,
        sizeBytes: input.file.size,
        filename: input.file.name,
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: input.file,
        headers: { "Content-Type": input.file.type },
      });
      if (!response.ok) throw new Error("Upload failed");

      return apiClient.file.confirmUpload.mutate({ id: fileId });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useDeleteFileMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) => apiClient.file.deleteFile.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}
