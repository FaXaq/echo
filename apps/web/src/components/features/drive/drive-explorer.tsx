import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { tinykeys } from "tinykeys";
import {
  DragDropProvider,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  MoreVertical,
  Music,
  Pen,
  Trash,
  Upload,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { evaluateOsFileDrop, resolveDropTargetFolderId } from "@/lib/drive-drop";
import { downloadBlob, downloadFile, formatSize } from "@/lib/file";
import { cn } from "@/lib/utils";
import {
  DRIVE_BULK_DOWNLOAD_MAX_BYTES,
  DRIVE_BULK_DOWNLOAD_MAX_FILES,
  buildDriveZip,
  buildDriveZipFilename,
  isWithinBulkDownloadLimit,
  type DriveZipEntry,
} from "@/lib/drive-zip";
import { getInitials } from "@/lib/remeda";
import {
  getFileDownloadUrl,
  getFolderContentsQueryOptions,
  useCreateFolderMutation,
  useDeleteFileMutation,
  useDeleteFolderMutation,
  useMoveFileMutation,
  useMoveFolderMutation,
  useRenameFileMutation,
  useRenameFolderMutation,
  useUploadFileMutation,
  type DriveSortField,
  type DriveSortOrder,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations } from "@/services/resources/organization";
import { useFolderPath } from "@/hooks/use-folder-path";
import { DriveSearchCombobox } from "./drive-search-combobox";
import { FolderNameDialog } from "./folder-name-dialog";

const KIND_ICON = {
  audio: Music,
  video: Video,
  image: ImageIcon,
  document: FileText,
} as const;

function formatDate(date: string | null) {
  return date ? dayjs(date).format("MMM D, YYYY") : "—";
}

type DriveItemKind = "file" | "folder";
type SelectionKey = `${DriveItemKind}:${string}`;

function selectionKey(kind: DriveItemKind, id: string): SelectionKey {
  return `${kind}:${id}`;
}

type DragData = { kind: "file"; id: string } | { kind: "folder"; id: string };

type DragEndEventPayload = Parameters<DragEndEvent>[0];
type DragStartEventPayload = Parameters<DragStartEvent>[0];

function readDragData(data: Record<string, unknown> | undefined): DragData | null {
  if (!data) return null;
  const { kind, id } = data;
  if ((kind === "file" || kind === "folder") && typeof id === "string") return { kind, id };
  return null;
}

function isFileDrag(event: React.DragEvent) {
  return event.dataTransfer.types.includes("Files");
}

function FolderRow({
  folder,
  selected,
  selectionCount,
  onNavigate,
  onToggleSelect,
  onContextMenuTrigger,
  onRename,
  onDelete,
  bulkDownloadDisabledReason,
  onBulkDownload,
  isBulkDownloading,
  onOsFilesDropped,
}: {
  folder: Folder;
  selected: boolean;
  selectionCount: number;
  onNavigate: () => void;
  onToggleSelect: (event: React.MouseEvent) => void;
  onContextMenuTrigger: () => void;
  onRename: () => void;
  onDelete: () => void;
  bulkDownloadDisabledReason: string | null;
  onBulkDownload: () => void;
  isBulkDownloading: boolean;
  onOsFilesDropped: (dataTransfer: DataTransfer) => void;
}) {
  const { t } = useLingui();
  const { isDragging, ref: dragRef } = useDraggable<DragData>({
    id: `folder:${folder.id}`,
    data: { kind: "folder", id: folder.id },
  });
  const { isDropTarget, ref: dropRef } = useDroppable<DragData>({
    id: `folder:${folder.id}`,
    data: { kind: "folder", id: folder.id },
  });
  const showDragBadge = isDragging && selected && selectionCount > 1;
  const isBulkSelected = selected && selectionCount > 1;
  const [isOsDropTarget, setIsOsDropTarget] = useState(false);
  const osDragDepthRef = useRef(0);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <TableRow
            ref={(node) => {
              dragRef(node);
              dropRef(node);
            }}
            data-dragging={isDragging}
            data-drop-target={isDropTarget}
            data-os-drop-target={isOsDropTarget}
            data-state={selected ? "selected" : undefined}
            onClick={(event) => {
              if (event.shiftKey || event.metaKey || event.ctrlKey) {
                onToggleSelect(event);
              } else {
                onNavigate();
              }
            }}
            onContextMenu={onContextMenuTrigger}
            onDragEnter={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              osDragDepthRef.current += 1;
              setIsOsDropTarget(true);
            }}
            onDragOver={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
            }}
            onDragLeave={(event) => {
              if (!isFileDrag(event)) return;
              osDragDepthRef.current -= 1;
              if (osDragDepthRef.current <= 0) {
                osDragDepthRef.current = 0;
                setIsOsDropTarget(false);
              }
            }}
            onDrop={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              osDragDepthRef.current = 0;
              setIsOsDropTarget(false);
              onOsFilesDropped(event.dataTransfer);
            }}
            className="group/row cursor-pointer data-[drop-target=true]:bg-primary/5 data-[dragging=true]:opacity-50 data-[os-drop-target=true]:bg-accent data-[os-drop-target=true]:ring-1 data-[os-drop-target=true]:ring-inset data-[os-drop-target=true]:ring-primary"
          />
        }
      >
        <TableCell
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect(event);
          }}
        >
          <Checkbox checked={selected} aria-label={t`Select ${folder.name}`} />
        </TableCell>
        <TableCell>
          <div className="relative flex items-center gap-2.5">
            {isOsDropTarget ? (
              <Upload className="size-4 shrink-0 text-primary" />
            ) : isDropTarget ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">{folder.name}</span>
            {showDragBadge && (
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow">
                {selectionCount}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell />
        <TableCell />
        <TableCell className="text-muted-foreground">{formatDate(folder.updatedAt)}</TableCell>
        <TableCell />
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/row:opacity-100"
                  aria-label={t`Actions for ${folder.name}`}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onRename();
                }}
              >
                <Pen />
                {t`Rename`}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Trash />
                {t`Delete`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBulkSelected ? (
          bulkDownloadDisabledReason ? (
            <Tooltip>
              <TooltipTrigger
                render={<ContextMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
              >
                <Download />
                {t`Download`}
              </TooltipTrigger>
              <TooltipContent>{bulkDownloadDisabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <ContextMenuItem onClick={onBulkDownload} disabled={isBulkDownloading}>
              {isBulkDownloading ? <Spinner className="size-4" /> : <Download />}
              {t`Download`}
            </ContextMenuItem>
          )
        ) : (
          <>
            <ContextMenuItem onClick={onRename}>
              <Pen />
              {t`Rename`}
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash />
              {t`Delete`}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FileRow({
  file,
  projectSlug,
  selected,
  selectionCount,
  onToggleSelect,
  onContextMenuTrigger,
  onRename,
  onDelete,
  onDownload,
  bulkDownloadDisabledReason,
  onBulkDownload,
  isBulkDownloading,
}: {
  file: OrganizationFile;
  projectSlug: string;
  selected: boolean;
  selectionCount: number;
  onToggleSelect: (event: React.MouseEvent) => void;
  onContextMenuTrigger: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  bulkDownloadDisabledReason: string | null;
  onBulkDownload: () => void;
  isBulkDownloading: boolean;
}) {
  const { t } = useLingui();
  const Icon = KIND_ICON[file.kind];
  const { isDragging, ref } = useDraggable<DragData>({
    id: `file:${file.id}`,
    data: { kind: "file", id: file.id },
  });
  const showDragBadge = isDragging && selected && selectionCount > 1;
  const isBulkSelected = selected && selectionCount > 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <TableRow
            ref={ref}
            data-dragging={isDragging}
            data-state={selected ? "selected" : undefined}
            onClick={(event) => {
              if (event.shiftKey || event.metaKey || event.ctrlKey) {
                onToggleSelect(event);
              }
            }}
            onContextMenu={onContextMenuTrigger}
            className="group/row data-[dragging=true]:opacity-50"
          />
        }
      >
        <TableCell
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect(event);
          }}
        >
          <Checkbox checked={selected} aria-label={t`Select ${file.filename}`} />
        </TableCell>
        <TableCell>
          <div className="relative flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{file.filename}</span>
            {showDragBadge && (
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow">
                {selectionCount}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {file.eventId && file.eventTitle && (
            <Link
              to="/projects/$projectSlug/calendar/$eventId"
              params={{ projectSlug, eventId: file.eventId }}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="size-3 shrink-0" />
              <span className="truncate">{file.eventTitle}</span>
            </Link>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {getInitials(file.uploadedByName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{file.uploadedByName}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(file.updatedAt)}</TableCell>
        <TableCell className="text-muted-foreground">{formatSize(file.sizeBytes)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/row:opacity-100"
                  aria-label={t`Actions for ${file.filename}`}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onDownload();
                }}
              >
                <Download />
                {t`Download`}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onRename();
                }}
              >
                <Pen />
                {t`Rename`}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Trash />
                {t`Delete`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBulkSelected ? (
          bulkDownloadDisabledReason ? (
            <Tooltip>
              <TooltipTrigger
                render={<ContextMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
              >
                <Download />
                {t`Download`}
              </TooltipTrigger>
              <TooltipContent>{bulkDownloadDisabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <ContextMenuItem onClick={onBulkDownload} disabled={isBulkDownloading}>
              {isBulkDownloading ? <Spinner className="size-4" /> : <Download />}
              {t`Download`}
            </ContextMenuItem>
          )
        ) : (
          <>
            <ContextMenuItem onClick={onDownload}>
              <Download />
              {t`Download`}
            </ContextMenuItem>
            <ContextMenuItem onClick={onRename}>
              <Pen />
              {t`Rename`}
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash />
              {t`Delete`}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SortableHeader({
  label,
  field,
  activeSort,
  activeOrder,
  onSortChange,
}: {
  label: string;
  field: DriveSortField;
  activeSort: DriveSortField;
  activeOrder: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}) {
  const isActive = activeSort === field;
  const Icon = isActive ? (activeOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", !isActive && "text-muted-foreground")}
      onClick={() => onSortChange(field)}
    >
      {label}
      <Icon className="size-3.5" />
    </Button>
  );
}

function DriveBreadcrumbs({ projectSlug, path }: { projectSlug: string; path: Folder[] }) {
  const { t } = useLingui();
  const isRoot = path.length === 0;

  return (
    <Breadcrumb>
      <BreadcrumbList className="list-none">
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage>{t`Drive`}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              render={<Link to="/projects/$projectSlug/drive" params={{ projectSlug }} />}
            >
              {t`Drive`}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {path.map((folder, index) => (
          <Fragment key={folder.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                <BreadcrumbPage>{folder.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={
                    <Link
                      to="/projects/$projectSlug/drive/$folderId"
                      params={{ projectSlug, folderId: folder.id }}
                    />
                  }
                >
                  {folder.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SelectionActionsMenu({
  downloadDisabledReason,
  isDownloading,
  onDownload,
  onClear,
}: {
  downloadDisabledReason: string | null;
  isDownloading: boolean;
  onDownload: () => void;
  onClear: () => void;
}) {
  const { t } = useLingui();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t`Selection actions`}
          />
        }
      >
        <MoreVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {downloadDisabledReason ? (
          <Tooltip>
            <TooltipTrigger
              render={<DropdownMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
            >
              <Download />
              {t`Download`}
            </TooltipTrigger>
            <TooltipContent>{downloadDisabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? <Spinner className="size-4" /> : <Download />}
            {t`Download`}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onClear}>{t`Clear selection`}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<SelectionKey>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTableDragActive, setIsTableDragActive] = useState(false);
  const selectionAnchorRef = useRef<number | null>(null);
  const tableDragDepthRef = useRef(0);

  useEffect(() => {
    setSelectedKeys(new Set());
    selectionAnchorRef.current = null;
  }, [folderId]);

  useEffect(() => {
    return tinykeys(window, {
      Escape: () => {
        setSelectedKeys(new Set());
        selectionAnchorRef.current = null;
      },
    });
  }, []);

  const createFolderMutation = useCreateFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const moveFolderMutation = useMoveFolderMutation();
  const moveFileMutation = useMoveFileMutation();
  const uploadMutation = useUploadFileMutation();
  const renameFileMutation = useRenameFileMutation();
  const deleteFileMutation = useDeleteFileMutation();

  const visibleFolders = data.folders.filter((folder) => !pendingDeleteIds.has(folder.id));
  const visibleFiles = data.files.filter((file) => !pendingDeleteIds.has(file.id));
  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;

  const rows: { kind: DriveItemKind; id: string }[] = [
    ...visibleFolders.map((folder) => ({ kind: "folder" as const, id: folder.id })),
    ...visibleFiles.map((file) => ({ kind: "file" as const, id: file.id })),
  ];

  const selectedFiles = visibleFiles.filter((file) =>
    selectedKeys.has(selectionKey("file", file.id)),
  );
  const selectedFolderCount = visibleFolders.filter((folder) =>
    selectedKeys.has(selectionKey("folder", folder.id)),
  ).length;

  const downloadDisabledReason =
    selectedFolderCount > 0
      ? t`Only a selection of files can be downloaded together`
      : !isWithinBulkDownloadLimit(selectedFiles)
        ? t`Selections are limited to ${DRIVE_BULK_DOWNLOAD_MAX_FILES} files or ${formatSize(DRIVE_BULK_DOWNLOAD_MAX_BYTES)} total`
        : null;

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

  const toggleSelection = (kind: DriveItemKind, id: string, options: { shiftKey?: boolean }) => {
    const key = selectionKey(kind, id);
    const index = rows.findIndex((row) => row.kind === kind && row.id === id);

    setSelectedKeys((prev) => {
      if (options.shiftKey && selectionAnchorRef.current !== null) {
        const start = Math.min(selectionAnchorRef.current, index);
        const end = Math.max(selectionAnchorRef.current, index);
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          next.add(selectionKey(rows[i].kind, rows[i].id));
        }
        return next;
      }
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    if (!options.shiftKey) selectionAnchorRef.current = index;
  };

  const replaceSelection = (kind: DriveItemKind, id: string) => {
    selectionAnchorRef.current = rows.findIndex((row) => row.kind === kind && row.id === id);
    setSelectedKeys(new Set([selectionKey(kind, id)]));
  };

  const clearSelection = () => {
    setSelectedKeys(new Set());
    selectionAnchorRef.current = null;
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === rows.length && rows.length > 0) {
      clearSelection();
    } else {
      setSelectedKeys(new Set(rows.map((row) => selectionKey(row.kind, row.id))));
    }
  };

  const handleDragStart = (event: DragStartEventPayload) => {
    const source = readDragData(event.operation.source?.data);
    if (!source) return;
    if (!selectedKeys.has(selectionKey(source.kind, source.id))) {
      replaceSelection(source.kind, source.id);
    }
  };

  const handleDragEnd = (event: DragEndEventPayload) => {
    const source = readDragData(event.operation.source?.data);
    const target = readDragData(event.operation.target?.data);
    if (!source || !target || target.kind !== "folder") return;

    const sourceKey = selectionKey(source.kind, source.id);
    const movingKeys = selectedKeys.has(sourceKey) ? Array.from(selectedKeys) : [sourceKey];
    const movingItems = movingKeys
      .map((key) => {
        const [kind, id] = key.split(":") as [DriveItemKind, string];
        return { kind, id, key };
      })
      .filter((item) => !(item.kind === "folder" && item.id === target.id));

    if (movingItems.length === 0) return;

    if (movingItems.length === 1) {
      const item = movingItems[0];
      if (item.kind === "file") {
        moveFileMutation.mutate({ id: item.id, organizationId, folderId: target.id });
      } else {
        moveFolderMutation.mutate({ id: item.id, organizationId, parentFolderId: target.id });
      }
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(item.key);
        return next;
      });
      return;
    }

    Promise.allSettled(
      movingItems.map((item) =>
        item.kind === "file"
          ? moveFileMutation.mutateAsync({ id: item.id, organizationId, folderId: target.id })
          : moveFolderMutation.mutateAsync({
              id: item.id,
              organizationId,
              parentFolderId: target.id,
            }),
      ),
    ).then((results) => {
      const failedNames: string[] = [];
      const succeededKeys: SelectionKey[] = [];

      results.forEach((result, index) => {
        const item = movingItems[index];
        if (result.status === "fulfilled") {
          succeededKeys.push(item.key);
        } else {
          const name =
            item.kind === "file"
              ? visibleFiles.find((file) => file.id === item.id)?.filename
              : visibleFolders.find((folder) => folder.id === item.id)?.name;
          failedNames.push(name ?? item.id);
        }
      });

      setSelectedKeys((prev) => {
        const next = new Set(prev);
        succeededKeys.forEach((key) => next.delete(key));
        return next;
      });

      if (failedNames.length === 0) {
        toast.add({ title: t`${movingItems.length} items moved`, type: "success" });
      } else {
        toast.add({
          title: t`${succeededKeys.length} of ${movingItems.length} moved — failed: ${failedNames.join(", ")}`,
          type: "error",
        });
      }
    });
  };

  const uploadFile = (file: File, targetFolderId: string | null) => {
    uploadMutation.mutate(
      { organizationId, folderId: targetFolderId, file },
      { onError: () => toast.add({ title: t`Couldn't upload ${file.name}`, type: "error" }) },
    );
  };

  const handleOsDrop = (dataTransfer: DataTransfer, hoveredFolderId: string | null) => {
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

    const targetFolderId = resolveDropTargetFolderId({
      hoveredFolderId,
      currentFolderId: folderId,
    });
    Array.from(dataTransfer.files).forEach((file) => uploadFile(file, targetFolderId));
  };

  const clearPendingDelete = (id: string) => {
    setPendingDeleteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const scheduleDelete = (id: string, title: string, commit: () => void) => {
    setPendingDeleteIds((prev) => new Set(prev).add(id));
    let undone = false;
    const toastId = toast.add({
      title,
      type: "success",
      actionProps: {
        children: t`Undo`,
        onClick: () => {
          undone = true;
          clearPendingDelete(id);
          toast.close(toastId);
        },
      },
      onRemove: () => {
        if (!undone) commit();
      },
    });
  };

  const handleDownloadFile = async (file: OrganizationFile) => {
    try {
      const { downloadUrl } = await getFileDownloadUrl({ id: file.id, organizationId });
      await downloadFile(downloadUrl, file.filename);
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

  const allSelected = rows.length > 0 && selectedKeys.size === rows.length;
  const someSelected = selectedKeys.size > 0 && !allSelected;

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

      <p className="text-xs text-muted-foreground">
        <Plural value={visibleFolders.length + visibleFiles.length} one="# item" other="# items" />
        {selectedKeys.size > 0 && (
          <>
            {" · "}
            <Plural value={selectedKeys.size} one="# item selected" other="# items selected" />
          </>
        )}
      </p>

      <FolderNameDialog
        open={creatingFolder}
        onOpenChange={setCreatingFolder}
        title={t`New folder`}
        onConfirm={(name) =>
          createFolderMutation.mutate({ organizationId, parentFolderId: folderId, name })
        }
      />

      <FolderNameDialog
        open={renamingFolder !== null}
        onOpenChange={(open) => !open && setRenamingFolder(null)}
        title={t`Rename folder`}
        initialName={renamingFolder?.name}
        onConfirm={(name) => {
          if (renamingFolder)
            renameFolderMutation.mutate(
              { id: renamingFolder.id, organizationId, name },
              { onError: () => toast.add({ title: t`Couldn't rename folder`, type: "error" }) },
            );
        }}
      />

      <ConfirmDialog
        open={deletingFolder !== null}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
        variant="destructive"
        title={t`Delete this folder?`}
        description={t`This permanently deletes the folder and any files inside it that aren't attached to an event or song. Files still attached elsewhere are kept and simply removed from this folder. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={() => {
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
      />

      <FolderNameDialog
        open={renamingFile !== null}
        onOpenChange={(open) => !open && setRenamingFile(null)}
        title={t`Rename file`}
        initialName={renamingFile?.filename}
        onConfirm={(filename) => {
          if (renamingFile)
            renameFileMutation.mutate(
              { id: renamingFile.id, organizationId, filename },
              { onError: () => toast.add({ title: t`Couldn't rename file`, type: "error" }) },
            );
        }}
      />

      <ConfirmDialog
        open={deletingFile !== null}
        onOpenChange={(open) => !open && setDeletingFile(null)}
        variant="destructive"
        title={t`Delete this file?`}
        description={t`This permanently deletes the file, including from any event or song it's attached to. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={() => {
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
