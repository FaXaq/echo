import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import {
  isRawImage,
  MAX_THUMBNAIL_BYTES,
  mimeTypeForFile,
  type DriveLocation,
  type FolderPlace,
  type Place,
  type Role,
} from "@echo/modules/drive/domain";
import { z } from "zod";
import { apiClient } from "@/services/api-client";
import {
  createThumbnail,
  downloadFile,
  extractRawPreview,
  getMediaMetadata,
  putWithProgress,
} from "@/lib/file";
import { resetUploadProgress, setUploadDuration, setUploadProgress } from "@/lib/upload-progress";
import { initResourceKey } from "./init-resource-key";
import { getStorageQuotaQueryOptions } from "./plan";

export const driveSortFieldSchema = z.enum(["name", "updatedAt", "sizeBytes"]);
export const driveSortOrderSchema = z.enum(["asc", "desc"]);
export type DriveSortField = z.infer<typeof driveSortFieldSchema>;
export type DriveSortOrder = z.infer<typeof driveSortOrderSchema>;

const { key, getResourceKey } = initResourceKey("drive");

export { key };

export const uploadFileMutationKey = ["drive", "uploadFile"] as const;

export type EventFile = RouterOutputs["drive"]["listEventFiles"][number];
export type SongFile = RouterOutputs["drive"]["listSongFiles"][number];
export type OrganizationFile = RouterOutputs["drive"]["listOrganizationFiles"][number];
export type RecentFile = RouterOutputs["drive"]["listRecentFiles"][number];
export type Folder = RouterOutputs["drive"]["getFolder"];
export type FolderContents = RouterOutputs["drive"]["listFolderContents"];
export type FolderListItem = FolderContents["folders"][number];

export function listFolderContentsQueryOptions(opts: {
  location: DriveLocation;
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
          location: params.location,
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

export function getDriveLocationPathQueryKey(opts: {
  location: DriveLocation;
  organizationId: string;
}) {
  return getResourceKey("locationPath", opts);
}

export function getFolderPathQueryOptions(opts: { id: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("getFolderPath", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.getFolderPath.query(params, { signal });
    },
  });
}

export function fileOccurrencesQueryOptions(opts: { fileIds: string[]; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listFileOccurrences", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listFileOccurrences.query(params, { signal });
    },
  });
}

export function previewFolderDeleteQueryOptions(opts: { id: string; organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("previewFolderDelete", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.previewFolderDelete.query(params, { signal });
    },
    gcTime: 0,
  });
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

export function useMoveFoldersMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { ids: string[]; organizationId: string; parentFolderId: string | null }) =>
      apiClient.drive.moveFolders.mutate(input),
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

export function useAddOccurrencesMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { fileIds: string[]; place: Place; organizationId: string }) =>
      apiClient.drive.addOccurrences.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useRemoveOccurrencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { fileIds: string[]; place: Place; organizationId: string }) =>
      apiClient.drive.removeOccurrences.mutate(input),
    onSuccess: async (result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        result.deletedFileIds.length > 0 &&
          queryClient.invalidateQueries({
            queryKey: getStorageQuotaQueryOptions({ organizationId: input.organizationId })
              .queryKey,
          }),
      ]);
    },
  });
}

export function useMoveFilesMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      ids: string[];
      organizationId: string;
      from: FolderPlace;
      folderId: string | null;
    }) => apiClient.drive.moveFiles.mutate(input),
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
  place: Place;
  organizationId: string;
  file: File;
  destinationLabel: string;
  songAudioRole?: Role;
}

// Best effort: the original still uploads without its derived images.
async function putDerivedJpeg(url: string | null, blob: Blob | null) {
  if (!url || !blob) return;
  await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "image/jpeg" },
  }).catch(() => undefined);
}

export function useUploadFileMutation({
  onSuccess,
}: {
  onSuccess?: (file: RouterOutputs["drive"]["confirmUpload"], input: UploadFileInput) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: uploadFileMutationKey,
    mutationFn: async (input: UploadFileInput) => {
      resetUploadProgress(input.file);
      const metadata = await getMediaMetadata(input.file);
      setUploadDuration(input.file, metadata.durationSeconds);
      const mimeType = mimeTypeForFile(input.file);
      const preview = isRawImage(mimeType) ? await extractRawPreview(input.file) : null;
      const generated = await createThumbnail(input.file, mimeType, preview);
      const thumbnail =
        generated && generated.blob.size <= MAX_THUMBNAIL_BYTES ? generated.blob : null;

      const { fileId, uploadUrl, previewUploadUrl, thumbnailUploadUrl } =
        await apiClient.drive.createUpload.mutate({
          place: input.place,
          organizationId: input.organizationId,
          mimeType,
          sizeBytes: input.file.size,
          ...metadata,
          width: metadata.width ?? generated?.width,
          height: metadata.height ?? generated?.height,
          filename: input.file.name,
          previewSizeBytes: preview?.size,
          thumbnailSizeBytes: thumbnail?.size,
        });

      setUploadProgress(input.file, 0);
      await putWithProgress(uploadUrl, input.file, mimeType, (ratio) =>
        setUploadProgress(input.file, ratio),
      );

      await Promise.all([
        putDerivedJpeg(previewUploadUrl, preview),
        putDerivedJpeg(thumbnailUploadUrl, thumbnail),
      ]);

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
      onSuccess?.(result, input);
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

export function getFileDownloadUrl(input: {
  id: string;
  organizationId: string;
  download?: boolean;
}) {
  return apiClient.drive.getFileDownloadUrl.query(input);
}

export async function downloadOrganizationFile(input: { id: string; organizationId: string }) {
  const { downloadUrl } = await getFileDownloadUrl({ ...input, download: true });
  downloadFile(downloadUrl);
}

export function getFilesDownloadUrls(input: { ids: string[]; organizationId: string }) {
  return apiClient.drive.getFilesDownloadUrls.mutate(input);
}

export function getRecentFilesQueryOptions(opts: { organizationId: string; limit?: number }) {
  return queryOptions({
    queryKey: getResourceKey("listRecentFiles", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listRecentFiles.query(params, { signal });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getRecentMediaQueryOptions(opts: { organizationId: string; limit?: number }) {
  return queryOptions({
    queryKey: getResourceKey("listRecentMedia", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.drive.listRecentMedia.query(params, { signal });
    },
    staleTime: 5 * 60 * 1000,
  });
}
