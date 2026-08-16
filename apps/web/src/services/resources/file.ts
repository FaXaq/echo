import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";
import { getStorageQuotaQueryOptions } from "./plan";

const { key, getResourceKey } = initResourceKey("file");

export { key };

export type EventFile = RouterOutputs["file"]["listEventFiles"][number];
export type OrganizationFile = RouterOutputs["file"]["listOrganizationFiles"][number];
export type Folder = RouterOutputs["file"]["getFolder"];
export type FolderContents = RouterOutputs["file"]["listFolderContents"];

export function getFolderContentsQueryOptions(opts: {
  folderId: string | null;
  organizationId: string;
}) {
  return queryOptions({
    queryKey: getResourceKey("listFolderContents", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.file.listFolderContents.query(params, { signal });
    },
  });
}

export function getFolderQueryOptions(opts: { id: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getFolder", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.file.getFolder.query(params, { signal });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getFolderPathQueryKey(opts: { folderId: string | null; organizationId: string }) {
  return getResourceKey("folderPath", opts);
}

export function useCreateFolderMutation({
  onSuccess,
}: { onSuccess?: (folder: Folder) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { organizationId: string; parentFolderId: string | null; name: string }) =>
      apiClient.file.createFolder.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useRenameFolderMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string; name: string }) =>
      apiClient.file.renameFolder.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useMoveFolderMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string; parentFolderId: string | null }) =>
      apiClient.file.moveFolder.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useDeleteFolderMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string }) =>
      apiClient.file.deleteFolder.mutate(input),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({
          queryKey: getStorageQuotaQueryOptions({ organizationId: input.organizationId }).queryKey,
        }),
      ]);
      onSuccess?.();
    },
  });
}

export function useMoveFileMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string; folderId: string | null }) =>
      apiClient.file.moveFile.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function getEventFilesQueryOptions(opts: { eventId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listEventFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.file.listEventFiles.query(params, { signal });
    },
    // Presigned download URLs are re-signed on every server call and expire
    // after an hour; keeping this fresh for a few minutes avoids re-fetching
    // (and re-decoding) unchanged audio/attachments every time a second
    // observer (e.g. the edit dialog) mounts on the same query key.
    staleTime: 5 * 60 * 1000,
  });
}

export function getOrganizationFilesQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listOrganizationFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.file.listOrganizationFiles.query(params, { signal });
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
    mutationFn: async (input: {
      eventId?: string;
      folderId?: string | null;
      organizationId: string;
      file: File;
    }) => {
      const { fileId, uploadUrl } = await apiClient.file.createUpload.mutate({
        eventId: input.eventId,
        folderId: input.folderId,
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

      return apiClient.file.confirmUpload.mutate({
        id: fileId,
        organizationId: input.organizationId,
      });
    },
    onSuccess: async (result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({
          queryKey: getStorageQuotaQueryOptions({ organizationId: input.organizationId }).queryKey,
        }),
      ]);
      onSuccess?.(result);
    },
  });
}

export function useDeleteFileMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string }) =>
      apiClient.file.deleteFile.mutate(input),
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({
          queryKey: getStorageQuotaQueryOptions({ organizationId: input.organizationId }).queryKey,
        }),
      ]);
      onSuccess?.();
    },
  });
}

export function useRenameFileMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; organizationId: string; filename: string }) =>
      apiClient.file.renameFile.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}
