import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { z } from "zod";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";
import { getStorageQuotaQueryOptions } from "./plan";

export const driveSortFieldSchema = z.enum(["name", "event", "updatedAt", "sizeBytes"]);
export const driveSortOrderSchema = z.enum(["asc", "desc"]);
export type DriveSortField = z.infer<typeof driveSortFieldSchema>;
export type DriveSortOrder = z.infer<typeof driveSortOrderSchema>;

const { key, getResourceKey } = initResourceKey("drive");

export { key };

export const uploadFileMutationKey = ["drive", "uploadFile"] as const;

export type EventFile = RouterOutputs["drive"]["listEventFiles"][number];
export type SongFile = RouterOutputs["drive"]["listSongFiles"][number];
export type OrganizationFile = RouterOutputs["drive"]["listOrganizationFiles"][number];
export type Folder = RouterOutputs["drive"]["getFolder"];
export type FolderContents = RouterOutputs["drive"]["listFolderContents"];

export function getFolderContentsQueryOptions(opts: {
  folderId: string | null;
  organizationId: string;
  sort: DriveSortField;
  order: DriveSortOrder;
}) {
  return queryOptions({
    queryKey: getResourceKey("listFolderContents", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listFolderContents.query(
        {
          organizationId: params.organizationId,
          folderId: params.folderId,
          sort: { field: params.sort, order: params.order },
        },
        { signal },
      );
    },
  });
}

export function getFolderQueryOptions(opts: { id: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getFolder", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.getFolder.query(params, { signal });
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
      apiClient.drive.createFolder.mutate(input),
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
      apiClient.drive.renameFolder.mutate(input),
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
      apiClient.drive.moveFolder.mutate(input),
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
      apiClient.drive.deleteFolder.mutate(input),
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
      apiClient.drive.moveFile.mutate(input),
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
      return apiClient.drive.listEventFiles.query(params, { signal });
    },
    // Presigned download URLs are re-signed on every server call and expire
    // after an hour; keeping this fresh for a few minutes avoids re-fetching
    // (and re-decoding) unchanged audio/attachments every time a second
    // observer (e.g. the edit dialog) mounts on the same query key.
    staleTime: 5 * 60 * 1000,
  });
}

export function getSongFilesQueryOptions(opts: { songId: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listSongFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listSongFiles.query(params, { signal });
    },
    // Same rationale as getEventFilesQueryOptions: presigned URLs are
    // re-signed per call and expire after an hour.
    staleTime: 5 * 60 * 1000,
  });
}

export function getOrganizationFilesQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listOrganizationFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listOrganizationFiles.query(params, { signal });
    },
  });
}

export function getDriveSearchQueryOptions(opts: { organizationId: string; query: string }) {
  return queryOptions({
    queryKey: getResourceKey("searchDrive", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.searchDrive.query(
        { organizationId: params.organizationId, query: params.query },
        { signal },
      );
    },
  });
}

export interface UploadFileInput {
  eventId?: string;
  songId?: string;
  folderId?: string | null;
  organizationId: string;
  file: File;
}

export function useUploadFileMutation({
  onSuccess,
}: {
  onSuccess?: (file: RouterOutputs["drive"]["confirmUpload"]) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: uploadFileMutationKey,
    mutationFn: async (input: UploadFileInput) => {
      const { fileId, uploadUrl } = await apiClient.drive.createUpload.mutate({
        eventId: input.eventId,
        songId: input.songId,
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

      return apiClient.drive.confirmUpload.mutate({
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
      apiClient.drive.deleteFile.mutate(input),
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
      apiClient.drive.renameFile.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function getFileDownloadUrl(input: { id: string; organizationId: string }) {
  return apiClient.drive.getFileDownloadUrl.query(input);
}
