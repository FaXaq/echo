import { Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { useTable } from "@tanstack/react-table";
import { Plural, useLingui } from "@lingui/react/macro";
import { DragDropProvider } from "@dnd-kit/react";
import { FolderPlus, Upload } from "lucide-react";
import {
  AttachmentCarouselDialog,
  type CarouselAttachment,
} from "@/components/ui/attachment-carousel-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { dataTableFeatures } from "@/components/ui/data-table-features";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  listFolderContentsQueryOptions,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useRemoveOccurrenceMutation,
  useRenameFileMutation,
  useRenameFolderMutation,
  type DriveSortField,
  type DriveSortOrder,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations } from "@/services/resources/organization";
import { useDriveLocationLabel, useDriveLocationPath } from "@/hooks/use-folder-path";
import { driveLocationLink, locationPlace } from "@/lib/drive-location";
import { getFileDownloadUrl, getFilesDownloadUrls } from "@/services/resources/drive";
import { useAudioPlayerStore } from "@/stores/audio-player-store";
import { DriveSearchCombobox } from "./drive-search-combobox";
import { SuspendedDriveQuotaBar } from "./suspended-drive-quota-bar";
import { DriveBreadcrumbs } from "./drive-breadcrumbs";
import { DriveExplorerDialogs } from "./drive-explorer-dialogs";
import { FileRow } from "./drive-file-row";
import { FileDetailsDialog } from "./file-details-dialog";
import { LinkFileToEventDialog } from "./link-file-to-event-dialog";
import { FolderRow } from "./drive-folder-row";
import { SystemFolderRow } from "./drive-system-folder-row";
import {
  type DriveItemKind,
  type DriveRow,
  isFileDrag,
  isSelectionKey,
  selectionKey,
} from "./drive-item-utils";
import { SelectionActionsMenu } from "./drive-selection-actions-menu";
import { useDriveTableColumns } from "./drive-table-columns";
import { useDriveFileTransfer } from "./use-drive-file-transfer";
import { useDrivePendingDeletes } from "./use-drive-pending-deletes";
import { useDriveSelection } from "./use-drive-selection";

function DriveExplorerContent({
  organizationId,
  projectSlug,
  location,
  sort,
  order,
  onSortChange,
}: {
  organizationId: string;
  projectSlug: string;
  location: DriveLocation;
  sort: DriveSortField;
  order: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useSuspenseQuery(
    listFolderContentsQueryOptions({ location, organizationId, sort, order }),
  );
  const { data: organizations } = useSuspenseQuery(selfListOrganizations());
  const path = useDriveLocationPath(location, organizationId);
  const locationLabel = useDriveLocationLabel();
  const folderId = location.kind === "folder" ? location.id : null;
  const place = locationPlace(location);
  const organizationName = organizations.find((org) => org.id === organizationId)?.name ?? "";

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [renamingFile, setRenamingFile] = useState<OrganizationFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<OrganizationFile | null>(null);
  const [assigningFiles, setAssigningFiles] = useState<OrganizationFile[]>([]);
  const [detailsFile, setDetailsFile] = useState<OrganizationFile | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [carouselFiles, setCarouselFiles] = useState<CarouselAttachment[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{
    file: OrganizationFile;
    downloadUrl: string;
  } | null>(null);
  const [documentPreviewFailed, setDocumentPreviewFailed] = useState(false);
  const [isTableDragActive, setIsTableDragActive] = useState(false);
  const tableDragDepthRef = useRef(0);

  const { pendingDeleteIds, scheduleDelete, clearPendingDelete } = useDrivePendingDeletes();
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);

  const createFolderMutation = useCreateFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const renameFileMutation = useRenameFileMutation();
  const removeOccurrenceMutation = useRemoveOccurrenceMutation();

  const visibleFolders = data.folders.filter((folder) => !pendingDeleteIds.has(folder.id));
  const visibleFiles = data.files.filter((file) => !pendingDeleteIds.has(file.id));
  const isEmpty =
    data.systemFolders.length === 0 && visibleFolders.length === 0 && visibleFiles.length === 0;

  const openGalleryPreview = (fileId: string) => {
    const galleryFiles = visibleFiles.filter(
      (file) => file.kind === "image" || file.kind === "video",
    );
    const index = galleryFiles.findIndex((file) => file.id === fileId);
    if (index === -1) return;

    setCarouselFiles(
      galleryFiles.map((file) => ({ id: file.id, filename: file.filename, kind: file.kind })),
    );
    setCarouselIndex(index);

    void getFilesDownloadUrls({
      ids: galleryFiles.map((file) => file.id),
      organizationId,
    }).then((urls) => {
      const urlsById = new Map(urls.map((entry) => [entry.id, entry]));
      setCarouselFiles((current) =>
        current.map((file) => ({
          ...file,
          downloadUrl: urlsById.get(file.id)?.downloadUrl,
          previewUrl: urlsById.get(file.id)?.previewUrl,
        })),
      );
    });
  };

  const openDocumentPreview = async (file: OrganizationFile) => {
    const { downloadUrl } = await getFileDownloadUrl({ id: file.id, organizationId });
    setDocumentPreviewFailed(false);
    setDocumentPreview({ file, downloadUrl });
  };

  const rows: { kind: DriveItemKind; id: string }[] = [
    ...visibleFolders.map((folder) => ({ kind: "folder" as const, id: folder.id })),
    ...visibleFiles.map((file) => ({ kind: "file" as const, id: file.id })),
  ];

  const tableRows: DriveRow[] = [
    ...visibleFolders.map((folder) => ({ kind: "folder" as const, data: folder })),
    ...visibleFiles.map((file) => ({ kind: "file" as const, data: file })),
  ];

  const {
    selectedKeys,
    setSelectedKeys,
    toggleSelection,
    replaceSelection,
    clearSelection,
    handleDragStart,
    handleDragEnd,
  } = useDriveSelection({ organizationId, location, rows, visibleFolders, visibleFiles });

  const columns = useDriveTableColumns({ sort, order, onSortChange });

  const rowSelection = Object.fromEntries(Array.from(selectedKeys, (key) => [key, true] as const));

  const table = useTable({
    features: dataTableFeatures,
    data: tableRows,
    columns,
    manualSorting: true,
    manualPagination: true,
    enableRowSelection: true,
    getRowId: (row) => selectionKey(row.kind, row.data.id),
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      setSelectedKeys((prev) => {
        const prevRowSelection = Object.fromEntries(
          Array.from(prev, (key) => [key, true] as const),
        );
        const next = typeof updater === "function" ? updater(prevRowSelection) : updater;
        return new Set(Object.keys(next).filter(isSelectionKey));
      });
    },
  });

  const selectedFiles = visibleFiles.filter((file) =>
    selectedKeys.has(selectionKey("file", file.id)),
  );
  const selectedFolderCount = visibleFolders.filter((folder) =>
    selectedKeys.has(selectionKey("folder", folder.id)),
  ).length;

  const {
    downloadDisabledReason,
    isDownloading,
    uploadFile,
    handleOsDrop,
    handleDownloadFile,
    handleBulkDownload,
  } = useDriveFileTransfer({
    organizationId,
    location,
    organizationName,
    path,
    selectedFiles,
    selectedFolderCount,
    clearSelection,
  });

  const deleteDisabledReason =
    selectedFolderCount > 0 ? t`Only a selection of files can be deleted together` : null;
  const assignDisabledReason =
    selectedFolderCount > 0 ? t`Only files can be assigned to an event` : null;

  const handleBulkDeleteFiles = async () => {
    if (!place) return;
    const results = await Promise.allSettled(
      selectedFiles.map((file) =>
        removeOccurrenceMutation.mutateAsync({ fileId: file.id, place, organizationId }),
      ),
    );
    const failedNames = results.flatMap((result, index) =>
      result.status === "rejected" ? [selectedFiles[index].filename] : [],
    );

    clearSelection();
    if (failedNames.length === 0) {
      toast.add({ title: t`${selectedFiles.length} files deleted`, type: "success" });
    } else {
      toast.add({
        title: t`${selectedFiles.length - failedNames.length} of ${selectedFiles.length} deleted — failed: ${failedNames.join(", ")}`,
        type: "error",
      });
    }
  };

  const navigateToLocation = (target: DriveLocation) =>
    navigate(driveLocationLink(projectSlug, target));

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col w-full">
          <DriveBreadcrumbs projectSlug={projectSlug} path={path} />
          <div className="flex items-center justify-between gap-2 w-full">
            <DriveSearchCombobox organizationId={organizationId} onSelect={navigateToLocation} />
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreatingFolder(true)}
              >
                <FolderPlus />
                <span className="hidden md:inline">{t`New Folder`}</span>
              </Button>
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload />
                <span className="hidden md:inline">{t`Upload`}</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-label={t`Upload files`}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  files.forEach((file) => uploadFile(file));
                  event.target.value = "";
                }}
              />
              {selectedKeys.size > 0 && (
                <SelectionActionsMenu
                  downloadDisabledReason={downloadDisabledReason}
                  isDownloading={isDownloading}
                  onDownload={handleBulkDownload}
                  deleteDisabledReason={deleteDisabledReason}
                  onDelete={() => setConfirmingBulkDelete(true)}
                  assignDisabledReason={assignDisabledReason}
                  onAssignToEvent={() => setAssigningFiles(selectedFiles)}
                  onClear={clearSelection}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Table
          containerClassName={cn(
            "min-h-0 border rounded border-border bg-card transition-colors",
            isTableDragActive && "border-dashed border-primary bg-primary/5",
          )}
          className="m-0"
          onDragEnter={(event) => {
            if (!isFileDrag(event)) return;
            event.preventDefault();
            tableDragDepthRef.current += 1;
            setIsTableDragActive(true);
          }}
          onDragOver={(event) => {
            if (!isFileDrag(event)) return;
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            if (!isFileDrag(event)) return;
            tableDragDepthRef.current -= 1;
            if (tableDragDepthRef.current <= 0) {
              tableDragDepthRef.current = 0;
              setIsTableDragActive(false);
            }
          }}
          onDrop={(event) => {
            if (!isFileDrag(event)) return;
            event.preventDefault();
            tableDragDepthRef.current = 0;
            setIsTableDragActive(false);
            handleOsDrop(event.dataTransfer, null);
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) =>
                  header.id === "select" ? (
                    <TableHead key={header.id} onClick={() => table.toggleAllRowsSelected()}>
                      <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={
                          table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
                        }
                        aria-label={t`Select all`}
                        className="pointer-events-none"
                      />
                    </TableHead>
                  ) : (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ),
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.systemFolders.map((entry) => (
              <SystemFolderRow
                key={entry.location.kind}
                name={locationLabel(entry.location, entry.name)}
                onNavigate={() => navigateToLocation(entry.location)}
              />
            ))}
            {table.getRowModel().rows.map((row) => {
              const original = row.original;
              return original.kind === "folder" ? (
                <FolderRow
                  key={row.id}
                  folder={original.data}
                  selected={row.getIsSelected()}
                  selectionCount={selectedKeys.size}
                  onNavigate={() => navigateToLocation({ kind: "folder", id: original.data.id })}
                  onToggleSelect={(event) =>
                    toggleSelection("folder", original.data.id, { shiftKey: event.shiftKey })
                  }
                  onContextMenuTrigger={() => {
                    if (!selectedKeys.has(selectionKey("folder", original.data.id))) {
                      replaceSelection("folder", original.data.id);
                    }
                  }}
                  onRename={() => setRenamingFolder(original.data)}
                  onDelete={() => setDeletingFolder(original.data)}
                  bulkDownloadDisabledReason={downloadDisabledReason}
                  onBulkDownload={handleBulkDownload}
                  isBulkDownloading={isDownloading}
                  onOsFilesDropped={(dataTransfer) => handleOsDrop(dataTransfer, original.data)}
                />
              ) : (
                <FileRow
                  key={row.id}
                  file={original.data}
                  selected={row.getIsSelected()}
                  selectionCount={selectedKeys.size}
                  onToggleSelect={(event) =>
                    toggleSelection("file", original.data.id, { shiftKey: event.shiftKey })
                  }
                  onContextMenuTrigger={() => {
                    if (!selectedKeys.has(selectionKey("file", original.data.id))) {
                      replaceSelection("file", original.data.id);
                    }
                  }}
                  onRename={() => setRenamingFile(original.data)}
                  onAssignToEvent={() => setAssigningFiles([original.data])}
                  onShowDetails={() => setDetailsFile(original.data)}
                  onDelete={() => setDeletingFile(original.data)}
                  onDownload={() => handleDownloadFile(original.data)}
                  onPlay={async () => {
                    const { downloadUrl } = await getFileDownloadUrl({
                      id: original.data.id,
                      organizationId,
                    });
                    requestPlay({
                      id: original.data.id,
                      filename: original.data.filename,
                      downloadUrl,
                    });
                  }}
                  onOpen={() =>
                    original.data.kind === "document"
                      ? openDocumentPreview(original.data)
                      : openGalleryPreview(original.data.id)
                  }
                  bulkDownloadDisabledReason={downloadDisabledReason}
                  onBulkDownload={handleBulkDownload}
                  isBulkDownloading={isDownloading}
                />
              );
            })}
            {isEmpty && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {location.kind === "root" ? t`No files yet` : t`This folder is empty`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DragDropProvider>

      <div className="flex items-center justify-between gap-6">
        <p className="text-xs text-muted-foreground">
          <Plural
            value={visibleFolders.length + visibleFiles.length}
            one="# item"
            other="# items"
          />
          {selectedKeys.size > 0 && (
            <>
              {" · "}
              <Plural value={selectedKeys.size} one="# item selected" other="# items selected" />
            </>
          )}
        </p>
        <SuspendedDriveQuotaBar organizationId={organizationId} />
      </div>

      <DriveExplorerDialogs
        creatingFolder={creatingFolder}
        onCreatingFolderChange={setCreatingFolder}
        onCreateFolder={(name) =>
          createFolderMutation.mutate({ organizationId, parentFolderId: folderId, name })
        }
        renamingFolder={renamingFolder}
        onRenamingFolderChange={(open) => !open && setRenamingFolder(null)}
        onRenameFolder={(name) => {
          if (renamingFolder)
            renameFolderMutation.mutate(
              { id: renamingFolder.id, organizationId, name },
              { onError: () => toast.add({ title: t`Couldn't rename folder`, type: "error" }) },
            );
        }}
        deletingFolder={deletingFolder}
        onDeletingFolderChange={(open) => !open && setDeletingFolder(null)}
        onConfirmDeleteFolder={() => {
          if (!deletingFolder) return;
          const { id } = deletingFolder;
          scheduleDelete(id, t`Folder deleted`, () =>
            deleteFolderMutation.mutate(
              { id, organizationId },
              {
                onError: () => {
                  clearPendingDelete(id);
                  toast.add({ title: t`Couldn't delete folder`, type: "error" });
                },
              },
            ),
          );
        }}
        renamingFile={renamingFile}
        onRenamingFileChange={(open) => !open && setRenamingFile(null)}
        onRenameFile={(filename) => {
          if (renamingFile)
            renameFileMutation.mutate(
              { id: renamingFile.id, organizationId, filename },
              { onError: () => toast.add({ title: t`Couldn't rename file`, type: "error" }) },
            );
        }}
        deletingFile={deletingFile}
        onDeletingFileChange={(open) => !open && setDeletingFile(null)}
        onConfirmDeleteFile={async () => {
          if (!deletingFile || !place) return;
          try {
            await removeOccurrenceMutation.mutateAsync({
              fileId: deletingFile.id,
              place,
              organizationId,
            });
            toast.add({ title: t`File deleted`, type: "success" });
          } catch {
            toast.add({ title: t`Couldn't delete file`, type: "error" });
          }
        }}
        bulkDeleteCount={confirmingBulkDelete ? selectedFiles.length : 0}
        onBulkDeleteCountChange={(open) => !open && setConfirmingBulkDelete(false)}
        onConfirmBulkDeleteFiles={handleBulkDeleteFiles}
      />

      <FileDetailsDialog
        file={detailsFile}
        organizationId={organizationId}
        onOpenChange={(open) => !open && setDetailsFile(null)}
      />

      <LinkFileToEventDialog
        files={assigningFiles}
        organizationId={organizationId}
        onOpenChange={(open) => !open && setAssigningFiles([])}
        onLinked={() => assigningFiles.length > 1 && clearSelection()}
      />

      <AttachmentCarouselDialog
        files={carouselFiles}
        openIndex={carouselIndex}
        onOpenChange={(open) => !open && setCarouselIndex(null)}
      />

      <FilePreviewDialog
        file={
          documentPreview && {
            filename: documentPreview.file.filename,
            mimeType: documentPreview.file.mimeType,
            downloadUrl: documentPreview.downloadUrl,
          }
        }
        failed={documentPreviewFailed}
        onOpenChange={(open) => !open && setDocumentPreview(null)}
        onError={() => setDocumentPreviewFailed(true)}
        onDownload={() => documentPreview && handleDownloadFile(documentPreview.file)}
      />
    </div>
  );
}

function DriveExplorerError() {
  const { t } = useLingui();
  return <p className="text-sm text-destructive">{t`Couldn't load Drive`}</p>;
}

function DriveExplorerSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export interface DriveExplorerProps {
  organizationId: string;
  projectSlug: string;
  location: DriveLocation;
  sort: DriveSortField;
  order: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}

export function DriveExplorer({
  organizationId,
  projectSlug,
  location,
  sort,
  order,
  onSortChange,
}: DriveExplorerProps) {
  return (
    <ErrorBoundary FallbackComponent={DriveExplorerError}>
      <Suspense fallback={<DriveExplorerSkeleton />}>
        <DriveExplorerContent
          organizationId={organizationId}
          projectSlug={projectSlug}
          location={location}
          sort={sort}
          order={order}
          onSortChange={onSortChange}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
