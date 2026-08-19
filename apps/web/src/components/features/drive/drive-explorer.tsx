import { Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { DragDropProvider } from "@dnd-kit/react";
import { FolderPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  getFolderContentsQueryOptions,
  useCreateFolderMutation,
  useDeleteFileMutation,
  useDeleteFolderMutation,
  useRenameFileMutation,
  useRenameFolderMutation,
  type DriveSortField,
  type DriveSortOrder,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations } from "@/services/resources/organization";
import { useFolderPath } from "@/hooks/use-folder-path";
import { DriveSearchCombobox } from "./drive-search-combobox";
import { SuspendedDriveQuotaBar } from "./suspended-drive-quota-bar";
import { DriveBreadcrumbs } from "./drive-breadcrumbs";
import { DriveExplorerDialogs } from "./drive-explorer-dialogs";
import { FileRow } from "./drive-file-row";
import { FolderRow } from "./drive-folder-row";
import { type DriveItemKind, isFileDrag, selectionKey } from "./drive-item-utils";
import { SelectionActionsMenu } from "./drive-selection-actions-menu";
import { SortableHeader } from "./drive-sortable-header";
import { useDriveFileTransfer } from "./use-drive-file-transfer";
import { useDrivePendingDeletes } from "./use-drive-pending-deletes";
import { useDriveSelection } from "./use-drive-selection";

function DriveExplorerContent({
  organizationId,
  projectSlug,
  folderId,
  sort,
  order,
  onSortChange,
}: {
  organizationId: string;
  projectSlug: string;
  folderId: string | null;
  sort: DriveSortField;
  order: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useSuspenseQuery(
    getFolderContentsQueryOptions({ folderId, organizationId, sort, order }),
  );
  const { data: organizations } = useSuspenseQuery(selfListOrganizations());
  const path = useFolderPath({ folderId, organizationId });
  const organizationName = organizations.find((org) => org.id === organizationId)?.name ?? "";

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [renamingFile, setRenamingFile] = useState<OrganizationFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<OrganizationFile | null>(null);
  const [isTableDragActive, setIsTableDragActive] = useState(false);
  const tableDragDepthRef = useRef(0);

  const { pendingDeleteIds, scheduleDelete, clearPendingDelete } = useDrivePendingDeletes();

  const createFolderMutation = useCreateFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const renameFileMutation = useRenameFileMutation();
  const deleteFileMutation = useDeleteFileMutation();

  const visibleFolders = data.folders.filter((folder) => !pendingDeleteIds.has(folder.id));
  const visibleFiles = data.files.filter((file) => !pendingDeleteIds.has(file.id));
  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;

  const rows: { kind: DriveItemKind; id: string }[] = [
    ...visibleFolders.map((folder) => ({ kind: "folder" as const, id: folder.id })),
    ...visibleFiles.map((file) => ({ kind: "file" as const, id: file.id })),
  ];

  const {
    selectedKeys,
    toggleSelection,
    replaceSelection,
    clearSelection,
    toggleSelectAll,
    handleDragStart,
    handleDragEnd,
    allSelected,
    someSelected,
  } = useDriveSelection({ organizationId, folderId, rows, visibleFolders, visibleFiles });

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
    folderId,
    organizationName,
    path,
    selectedFiles,
    selectedFolderCount,
    clearSelection,
  });

  const navigateToFolder = (id: string | null) => {
    if (id === null) {
      navigate({ to: "/projects/$projectSlug/drive", params: { projectSlug } });
    } else {
      navigate({
        to: "/projects/$projectSlug/drive/$folderId",
        params: { projectSlug, folderId: id },
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <DriveBreadcrumbs projectSlug={projectSlug} path={path} />
        <div className="flex items-center gap-2">
          <DriveSearchCombobox
            organizationId={organizationId}
            onSelectFolder={(id) => navigateToFolder(id)}
            onSelectFile={(file) => navigateToFolder(file.folderId)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setCreatingFolder(true)}>
            <FolderPlus />
            {t`New Folder`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            {t`Upload`}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            aria-label={t`Upload files`}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              files.forEach((file) => uploadFile(file, folderId));
              event.target.value = "";
            }}
          />
          {selectedKeys.size > 0 && (
            <SelectionActionsMenu
              downloadDisabledReason={downloadDisabledReason}
              isDownloading={isDownloading}
              onDownload={handleBulkDownload}
              onClear={clearSelection}
            />
          )}
        </div>
      </div>

      <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Table
          containerClassName={cn(
            "min-h-0 flex-1 border rounded border-border bg-card transition-colors",
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
            <TableRow>
              <TableHead onClick={() => toggleSelectAll()}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  aria-label={t`Select all`}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label={t`Name`}
                  field="name"
                  activeSort={sort}
                  activeOrder={order}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label={t`Event`}
                  field="event"
                  activeSort={sort}
                  activeOrder={order}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead>
                <Trans>Uploaded by</Trans>
              </TableHead>
              <TableHead>
                <SortableHeader
                  label={t`Last modified`}
                  field="updatedAt"
                  activeSort={sort}
                  activeOrder={order}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  label={t`Size`}
                  field="sizeBytes"
                  activeSort={sort}
                  activeOrder={order}
                  onSortChange={onSortChange}
                />
              </TableHead>
              <TableHead>
                <span className="sr-only">
                  <Trans>Actions</Trans>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleFolders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                selected={selectedKeys.has(selectionKey("folder", folder.id))}
                selectionCount={selectedKeys.size}
                onNavigate={() => navigateToFolder(folder.id)}
                onToggleSelect={(event) =>
                  toggleSelection("folder", folder.id, { shiftKey: event.shiftKey })
                }
                onContextMenuTrigger={() => {
                  if (!selectedKeys.has(selectionKey("folder", folder.id))) {
                    replaceSelection("folder", folder.id);
                  }
                }}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => setDeletingFolder(folder)}
                bulkDownloadDisabledReason={downloadDisabledReason}
                onBulkDownload={handleBulkDownload}
                isBulkDownloading={isDownloading}
                onOsFilesDropped={(dataTransfer) => handleOsDrop(dataTransfer, folder.id)}
              />
            ))}
            {visibleFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                projectSlug={projectSlug}
                selected={selectedKeys.has(selectionKey("file", file.id))}
                selectionCount={selectedKeys.size}
                onToggleSelect={(event) =>
                  toggleSelection("file", file.id, { shiftKey: event.shiftKey })
                }
                onContextMenuTrigger={() => {
                  if (!selectedKeys.has(selectionKey("file", file.id))) {
                    replaceSelection("file", file.id);
                  }
                }}
                onRename={() => setRenamingFile(file)}
                onDelete={() => setDeletingFile(file)}
                onDownload={() => handleDownloadFile(file)}
                bulkDownloadDisabledReason={downloadDisabledReason}
                onBulkDownload={handleBulkDownload}
                isBulkDownloading={isDownloading}
              />
            ))}
            {isEmpty && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {folderId === null ? t`No files yet` : t`This folder is empty`}
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
        onConfirmDeleteFile={() => {
          if (!deletingFile) return;
          const { id } = deletingFile;
          scheduleDelete(id, t`File deleted`, () =>
            deleteFileMutation.mutate(
              { id, organizationId },
              {
                onError: () => {
                  clearPendingDelete(id);
                  toast.add({ title: t`Couldn't delete file`, type: "error" });
                },
              },
            ),
          );
        }}
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
  folderId: string | null;
  sort: DriveSortField;
  order: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}

export function DriveExplorer({
  organizationId,
  projectSlug,
  folderId,
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
          folderId={folderId}
          sort={sort}
          order={order}
          onSortChange={onSortChange}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
