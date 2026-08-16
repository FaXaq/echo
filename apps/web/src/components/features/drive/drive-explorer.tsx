import { Fragment, Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { DragDropProvider, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/react";
import {
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSize } from "@/lib/file";
import { getInitials } from "@/lib/remeda";
import {
  getFolderContentsQueryOptions,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useMoveFileMutation,
  useMoveFolderMutation,
  useRenameFolderMutation,
  useUploadFileMutation,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/file";
import { useFolderPath } from "@/hooks/use-folder-path";
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

type DragData = { kind: "file"; id: string } | { kind: "folder"; id: string };

type DragEndEventPayload = Parameters<DragEndEvent>[0];

function readDragData(data: Record<string, unknown> | undefined): DragData | null {
  if (!data) return null;
  const { kind, id } = data;
  if ((kind === "file" || kind === "folder") && typeof id === "string") return { kind, id };
  return null;
}

function FolderRow({
  folder,
  onNavigate,
  onRename,
  onDelete,
}: {
  folder: Folder;
  onNavigate: () => void;
  onRename: () => void;
  onDelete: () => void;
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
            onClick={onNavigate}
            className="group/row cursor-pointer data-[drop-target=true]:bg-primary/5 data-[dragging=true]:opacity-50"
          />
        }
      >
        <TableCell>
          <div className="flex items-center gap-2.5">
            {isDropTarget ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">{folder.name}</span>
          </div>
        </TableCell>
        <TableCell />
        <TableCell className="text-muted-foreground">{formatDate(folder.createdAt)}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(folder.updatedAt)}</TableCell>
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
        <ContextMenuItem onClick={onRename}>
          <Pen />
          {t`Rename`}
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash />
          {t`Delete`}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FileRow({ file }: { file: OrganizationFile }) {
  const Icon = KIND_ICON[file.kind];
  const { isDragging, ref } = useDraggable<DragData>({
    id: `file:${file.id}`,
    data: { kind: "file", id: file.id },
  });

  return (
    <TableRow ref={ref} data-dragging={isDragging} className="data-[dragging=true]:opacity-50">
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{file.filename}</span>
        </div>
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
      <TableCell className="text-muted-foreground">{formatDate(file.createdAt)}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(file.updatedAt)}</TableCell>
      <TableCell className="text-muted-foreground">{formatSize(file.sizeBytes)}</TableCell>
    </TableRow>
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

function DriveExplorerContent({
  organizationId,
  projectSlug,
  folderId,
}: {
  organizationId: string;
  projectSlug: string;
  folderId: string | null;
}) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useSuspenseQuery(getFolderContentsQueryOptions({ folderId, organizationId }));
  const path = useFolderPath({ folderId, organizationId });

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const createFolderMutation = useCreateFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const moveFolderMutation = useMoveFolderMutation();
  const moveFileMutation = useMoveFileMutation();
  const uploadMutation = useUploadFileMutation();

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

  const handleDragEnd = (event: DragEndEventPayload) => {
    const source = readDragData(event.operation.source?.data);
    const target = readDragData(event.operation.target?.data);
    if (!source || !target || target.kind !== "folder") return;
    if (source.kind === "folder" && source.id === target.id) return;

    if (source.kind === "file") {
      moveFileMutation.mutate({ id: source.id, organizationId, folderId: target.id });
    } else {
      moveFolderMutation.mutate({ id: source.id, organizationId, parentFolderId: target.id });
    }
  };

  const isEmpty = data.folders.length === 0 && data.files.length === 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <DriveBreadcrumbs projectSlug={projectSlug} path={path} />
        <div className="flex items-center gap-2">
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
              files.forEach((file) => {
                uploadMutation.mutate({ organizationId, folderId, file });
              });
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <DragDropProvider onDragEnd={handleDragEnd}>
        <Table
          containerClassName="min-h-0 flex-1 border rounded border-border bg-card"
          className="m-0"
        >
          <TableHeader>
            <TableRow>
              <TableHead>
                <Trans>Name</Trans>
              </TableHead>
              <TableHead>
                <Trans>Uploaded by</Trans>
              </TableHead>
              <TableHead>
                <Trans>Date added</Trans>
              </TableHead>
              <TableHead>
                <Trans>Last modified</Trans>
              </TableHead>
              <TableHead>
                <Trans>Size</Trans>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.folders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                onNavigate={() => navigateToFolder(folder.id)}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => setDeletingFolder(folder)}
              />
            ))}
            {data.files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
            {isEmpty && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  {folderId === null ? t`No files yet` : t`This folder is empty`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DragDropProvider>

      <p className="text-xs text-muted-foreground">
        <Plural value={data.folders.length + data.files.length} one="# item" other="# items" />
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
            renameFolderMutation.mutate({ id: renamingFolder.id, organizationId, name });
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
          if (deletingFolder)
            deleteFolderMutation.mutate({ id: deletingFolder.id, organizationId });
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
}

export function DriveExplorer({ organizationId, projectSlug, folderId }: DriveExplorerProps) {
  return (
    <ErrorBoundary FallbackComponent={DriveExplorerError}>
      <Suspense fallback={<DriveExplorerSkeleton />}>
        <DriveExplorerContent
          organizationId={organizationId}
          projectSlug={projectSlug}
          folderId={folderId}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
