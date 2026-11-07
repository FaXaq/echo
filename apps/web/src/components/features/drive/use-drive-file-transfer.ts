import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { toast } from "@/components/ui/toast";
import { formatUploadDestination, useUploadFile } from "./use-upload-file";
import { evaluateOsFileDrop, resolveDropTargetFolderId } from "@/lib/drive-drop";
import { downloadBlob, formatSize } from "@/lib/file";
import {
  DRIVE_BULK_DOWNLOAD_MAX_BYTES,
  DRIVE_BULK_DOWNLOAD_MAX_FILES,
  buildDriveZip,
  buildDriveZipFilename,
  isWithinBulkDownloadLimit,
  type DriveZipEntry,
} from "@/lib/drive-zip";
import {
  downloadOrganizationFile,
  getFileDownloadUrl,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";

export function useDriveFileTransfer({
  organizationId,
  folderId,
  organizationName,
  path,
  selectedFiles,
  selectedFolderCount,
  clearSelection,
}: {
  organizationId: string;
  folderId: string | null;
  organizationName: string;
  path: Folder[];
  selectedFiles: OrganizationFile[];
  selectedFolderCount: number;
  clearSelection: () => void;
}) {
  const { t } = useLingui();
  const uploadMutation = useUploadFile();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadDisabledReason =
    selectedFolderCount > 0
      ? t`Only a selection of files can be downloaded together`
      : !isWithinBulkDownloadLimit(selectedFiles)
        ? t`Selections are limited to ${DRIVE_BULK_DOWNLOAD_MAX_FILES} files or ${formatSize(DRIVE_BULK_DOWNLOAD_MAX_BYTES)} total`
        : null;

  const uploadFile = (file: File, targetFolder: { id: string; name: string } | null = null) => {
    const destinationLabel = formatUploadDestination([
      t`Drive`,
      ...path.map((folder) => folder.name),
      targetFolder?.name,
    ]);
    const targetFolderId = resolveDropTargetFolderId({
      hoveredFolderId: targetFolder?.id ?? null,
      currentFolderId: folderId,
    });
    uploadMutation.mutate({ organizationId, folderId: targetFolderId, file, destinationLabel });
  };

  const handleOsDrop = (
    dataTransfer: DataTransfer,
    hoveredFolder: { id: string; name: string } | null,
  ) => {
    const entries = Array.from(dataTransfer.items)
      .map((item) => item.webkitGetAsEntry())
      .filter((entry): entry is FileSystemEntry => entry !== null)
      .map((entry) => ({ isFile: entry.isFile, isDirectory: entry.isDirectory }));

    const evaluation = evaluateOsFileDrop(entries);
    if (!evaluation.accepted) {
      if (evaluation.reason === "contains-directory") {
        toast.add({ title: t`Folders aren't supported yet — drop files only`, type: "error" });
      }
      return;
    }

    Array.from(dataTransfer.files).forEach((file) => uploadFile(file, hoveredFolder));
  };

  const handleDownloadFile = async (file: OrganizationFile) => {
    try {
      await downloadOrganizationFile({ id: file.id, organizationId });
    } catch {
      toast.add({ title: t`Couldn't download file`, type: "error" });
    }
  };

  const handleBulkDownload = async () => {
    if (downloadDisabledReason || isDownloading) return;

    setIsDownloading(true);
    try {
      const presignResults = await Promise.allSettled(
        selectedFiles.map(async (file) => {
          const { downloadUrl } = await getFileDownloadUrl({ id: file.id, organizationId });
          return { filename: file.filename, url: downloadUrl } satisfies DriveZipEntry;
        }),
      );

      const entries: DriveZipEntry[] = [];
      const skipped: string[] = [];
      presignResults.forEach((result, index) => {
        if (result.status === "fulfilled") entries.push(result.value);
        else skipped.push(selectedFiles[index].filename);
      });

      if (entries.length === 0) {
        toast.add({ title: t`Couldn't download the selected files`, type: "error" });
        return;
      }

      const { blob, skipped: fetchSkipped } = await buildDriveZip(entries);
      const allSkipped = [...skipped, ...fetchSkipped];

      const filename = buildDriveZipFilename({
        folderName: path.length > 0 ? path[path.length - 1].name : null,
        organizationName,
        date: new Date(),
      });
      downloadBlob(blob, filename);

      if (allSkipped.length > 0) {
        toast.add({
          title: t`Skipped ${allSkipped.length} file(s) that couldn't be downloaded: ${allSkipped.join(", ")}`,
          type: "error",
        });
      }
      clearSelection();
    } catch {
      toast.add({ title: t`Couldn't build the download`, type: "error" });
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadDisabledReason,
    isDownloading,
    uploadFile,
    handleOsDrop,
    handleDownloadFile,
    handleBulkDownload,
  };
}
