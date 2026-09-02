import { Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTable } from "@tanstack/react-table";
import { Plural, useLingui } from "@lingui/react/macro";
import { DragDropProvider } from "@dnd-kit/react";
import { FolderPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  } = useDriveSelection({ organizationId, folderId, rows, visibleFolders, visibleFiles });

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
            {table.getRowModel().rows.map((row) => {
              const original = row.original;
              return original.kind === "folder" ? (
                <FolderRow
                  key={row.id}
                  folder={original.data}
                  selected={row.getIsSelected()}
                  selectionCount={selectedKeys.size}
                  onNavigate={() => navigateToFolder(original.data.id)}
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
                  onOsFilesDropped={(dataTransfer) => handleOsDrop(dataTransfer, original.data.id)}
                />
              ) : (
                <FileRow
                  key={row.id}
                  file={original.data}
                  projectSlug={projectSlug}
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
                  onDelete={() => setDeletingFile(original.data)}
                  onDownload={() => handleDownloadFile(original.data)}
                  bulkDownloadDisabledReason={downloadDisabledReason}
                  onBulkDownload={handleBulkDownload}
                  isBulkDownloading={isDownloading}
                />
              );
            })}
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
