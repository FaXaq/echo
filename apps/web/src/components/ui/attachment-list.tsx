import { useState, type ReactNode } from "react";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import {
  DownloadIcon,
  FileText,
  FileWarning,
  ListChecks,
  MoreVertical,
  Music,
  Pen,
  Square,
  SquareCheck,
  Tag,
  Trash,
} from "lucide-react";
import type { FileKind, Role } from "@echo/modules/drive/domain";
import { Badge } from "@/components/ui/badge";
import { AttachmentCarouselDialog } from "@/components/ui/attachment-carousel-dialog";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSize } from "@/lib/file";
import { match } from "ts-pattern";

export interface PendingAttachment {
  key: number;
  filename: string;
  sizeBytes: number;
  kind?: FileKind | null;
}

export interface AttachmentFile {
  id: string;
  filename: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  role?: Role | null;
  version?: number | null;
}

export interface AttachmentListProps<F extends AttachmentFile> {
  files: F[];
  pendingFiles?: PendingAttachment[];
  actions?: ReactNode;
  selectedIds?: Set<string>;
  onSelect?: (file: F) => void;
  onUnselect?: (file: F) => void;
  onDeleteSelected?: (files: F[]) => Promise<void>;
  onDelete?: (file: F) => void;
  onRename?: (file: F) => void;
  onDownload?: (file: F) => void;
  onPlayAudio?: (file: F) => void;
  onSetAudioRole?: (file: F, role: Role) => void;
  onClearAudioRole?: (file: F) => void;
}

type AttachmentTab = "audio" | "gallery" | "misc";

const TAB_ORDER: AttachmentTab[] = ["audio", "gallery", "misc"];
const EMPTY_SELECTION: Set<string> = new Set();

function tabForKind(kind: FileKind | null | undefined): AttachmentTab {
  if (kind === "audio") return "audio";
  if (kind === "image" || kind === "video") return "gallery";
  return "misc";
}

function firstNonEmptyTab<F extends AttachmentFile>(
  files: F[],
  pendingFiles: PendingAttachment[],
): AttachmentTab {
  return (
    TAB_ORDER.find(
      (tab) =>
        files.some((file) => tabForKind(file.kind) === tab) ||
        pendingFiles.some((file) => tabForKind(file.kind) === tab),
    ) ?? "audio"
  );
}

function AttachmentListItems<F extends AttachmentFile>({
  files,
  pendingFiles,
  failedIds,
  selectedIds,
  onToggleSelect,
  onOpen,
  onPlayAudio,
  onRename,
  onDownload,
  onDelete,
  onSetAudioRole,
  onClearAudioRole,
}: {
  files: F[];
  pendingFiles: PendingAttachment[];
  failedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (file: F) => void;
  onOpen: (id: string) => void;
  onPlayAudio?: (file: F) => void;
  onRename?: (file: F) => void;
  onDownload?: (file: F) => void;
  onDelete?: (file: F) => void;
  onSetAudioRole?: (file: F, role: Role) => void;
  onClearAudioRole?: (file: F) => void;
}) {
  const { t } = useLingui();
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  if (files.length === 0 && pendingFiles.length === 0) {
    return (
      <p className="py-5 text-center text-[13px] text-muted-foreground">
        <Trans>No files here yet.</Trans>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5 m-0 p-0">
      {pendingFiles.map((file) => (
        <li key={file.key} className="m-0 p-0 list-none">
          <Attachment orientation="horizontal" className="w-full" state="uploading" size="sm">
            <AttachmentMedia>
              <Spinner />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.filename}</AttachmentTitle>
              <AttachmentDescription>{t`Uploading…`}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </li>
      ))}
      {files.map((file) => {
        const failed = failedIds.has(file.id);
        const selected = selectedIds.has(file.id);
        return (
          <li key={file.id} className="m-0 p-0 list-none">
            <Attachment
              orientation="horizontal"
              className="w-full"
              state={failed ? "error" : selected ? "selected" : "done"}
              size="sm"
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuId(file.id);
              }}
            >
              <AttachmentTrigger
                aria-label={t`Open ${file.filename}`}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    onToggleSelect(file);
                    return;
                  }
                  if (file.kind === "audio" && onPlayAudio) onPlayAudio(file);
                  else onOpen(file.id);
                }}
              />
              <AttachmentMedia>
                {match({ failed, kind: file.kind })
                  .with({ failed: true }, () => <FileWarning />)
                  .with({ kind: "audio" }, () => <Music />)
                  .otherwise(() => (
                    <FileText />
                  ))}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="flex items-center gap-1.5">
                  {file.filename}
                  {file.role && (
                    <Badge variant="secondary">
                      {file.role === "demo" ? t`Demo` : t`Final`}
                      {file.version != null && ` v${file.version}`}
                    </Badge>
                  )}
                </AttachmentTitle>
                <AttachmentDescription>
                  {failed ? t`Couldn't load this file` : formatSize(file.sizeBytes)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <DropdownMenu
                  open={contextMenuId === file.id}
                  onOpenChange={(open) => setContextMenuId(open ? file.id : null)}
                >
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t`Actions for ${file.filename}`}
                      />
                    }
                  >
                    <MoreVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onToggleSelect(file)}>
                      {selected ? <SquareCheck /> : <Square />}
                      {selected ? t`Deselect` : t`Select`}
                    </DropdownMenuItem>
                    {(onRename || onDownload || onDelete || onSetAudioRole || onClearAudioRole) && (
                      <DropdownMenuSeparator />
                    )}
                    {onRename && (
                      <DropdownMenuItem
                        onClick={() => {
                          onRename(file);
                        }}
                      >
                        <Pen />
                        {t`Rename`}
                      </DropdownMenuItem>
                    )}
                    {onDownload && (
                      <DropdownMenuItem
                        onClick={() => {
                          onDownload(file);
                        }}
                      >
                        <DownloadIcon />
                        {t`Download`}
                      </DropdownMenuItem>
                    )}
                    {file.kind === "audio" && file.role && onClearAudioRole && (
                      <DropdownMenuItem onClick={() => onClearAudioRole(file)}>
                        <Tag />
                        {t`Remove role`}
                      </DropdownMenuItem>
                    )}
                    {file.kind === "audio" && !file.role && onSetAudioRole && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Tag />
                          {t`Define as`}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => onSetAudioRole(file, "demo")}>
                            {t`Latest demo`}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetAudioRole(file, "final")}>
                            {t`Latest final`}
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {onDelete && (
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}>
                        <Trash />
                        {t`Delete`}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AttachmentActions>
            </Attachment>
          </li>
        );
      })}
    </ul>
  );
}

function AttachmentGalleryGrid<F extends AttachmentFile>({
  files,
  pendingFiles,
  failedIds,
  selectedIds,
  onToggleSelect,
  onOpen,
  onRename,
  onDownload,
  onDelete,
}: {
  files: F[];
  pendingFiles: PendingAttachment[];
  failedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (file: F) => void;
  onOpen: (id: string) => void;
  onRename?: (file: F) => void;
  onDownload?: (file: F) => void;
  onDelete?: (file: F) => void;
}) {
  const { t } = useLingui();
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  if (files.length === 0 && pendingFiles.length === 0) {
    return (
      <p className="py-5 text-center text-[13px] text-muted-foreground">
        <Trans>No files here yet.</Trans>
      </p>
    );
  }

  return (
    <ul className="m-0 p-0 flex flex-row flex-wrap gap-2">
      {pendingFiles.map((file) => (
        <li key={file.key} className="m-0 p-0 list-none">
          <Attachment orientation="vertical" className="w-full" state="uploading" size="sm">
            <AttachmentMedia>
              <Spinner />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.filename}</AttachmentTitle>
              <AttachmentDescription>{t`Uploading…`}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </li>
      ))}
      {files.map((file) => {
        const failed = failedIds.has(file.id);
        const selected = selectedIds.has(file.id);
        return (
          <li key={file.id} className="m-0 p-0 list-none">
            <Attachment
              orientation="vertical"
              className="w-full"
              state={failed ? "error" : selected ? "selected" : "done"}
              size="default"
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuId(file.id);
              }}
            >
              <AttachmentTrigger
                aria-label={t`Open ${file.filename}`}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    onToggleSelect(file);
                    return;
                  }
                  onOpen(file.id);
                }}
              />
              <AttachmentMedia variant={failed ? "icon" : "image"}>
                {match({ failed, kind: file.kind })
                  .with({ failed: true }, () => <FileWarning />)
                  .with({ kind: "video" }, () => (
                    <video
                      src={file.downloadUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-square h-full w-full object-cover m-0"
                    />
                  ))
                  .otherwise(() => (
                    <img
                      src={file.downloadUrl}
                      alt={file.filename}
                      loading="lazy"
                      className="m-0 block"
                    />
                  ))}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.filename}</AttachmentTitle>
                <AttachmentDescription>
                  {failed ? t`Couldn't load this file` : formatSize(file.sizeBytes)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <DropdownMenu
                  open={contextMenuId === file.id}
                  onOpenChange={(open) => setContextMenuId(open ? file.id : null)}
                >
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t`Actions for ${file.filename}`}
                      />
                    }
                  >
                    <MoreVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onToggleSelect(file)}>
                      {selected ? <SquareCheck /> : <Square />}
                      {selected ? t`Deselect` : t`Select`}
                    </DropdownMenuItem>
                    {(onRename || onDownload || onDelete) && <DropdownMenuSeparator />}
                    {onRename && (
                      <DropdownMenuItem
                        onClick={() => {
                          onRename(file);
                        }}
                      >
                        <Pen />
                        {t`Rename`}
                      </DropdownMenuItem>
                    )}
                    {onDownload && (
                      <DropdownMenuItem
                        onClick={() => {
                          onDownload(file);
                        }}
                      >
                        <DownloadIcon />
                        {t`Download`}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}>
                        <Trash />
                        {t`Delete`}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AttachmentActions>
            </Attachment>
          </li>
        );
      })}
    </ul>
  );
}

function AttachmentSelectionMenu<F extends AttachmentFile>({
  files,
  onDeleteSelected,
}: {
  files: F[];
  onDeleteSelected: (files: F[]) => Promise<void>;
}) {
  const { t } = useLingui();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t`Actions for selected files`}
            />
          }
        >
          <ListChecks />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash />
            {t`Delete`}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={<Plural value={files.length} one="Delete # file?" other="Delete # files?" />}
        description={t`This will permanently delete the selected files. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={() => onDeleteSelected(files)}
      />
    </>
  );
}

export function AttachmentList<F extends AttachmentFile>({
  files,
  pendingFiles = [],
  actions,
  selectedIds = EMPTY_SELECTION,
  onSelect,
  onUnselect,
  onDeleteSelected,
  onDelete,
  onRename,
  onDownload,
  onPlayAudio,
  onSetAudioRole,
  onClearAudioRole,
}: AttachmentListProps<F>) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<AttachmentTab>(() =>
    firstNonEmptyTab(files, pendingFiles),
  );

  const markFailed = (id: string) =>
    setFailedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const onToggleSelect = (file: F) =>
    selectedIds.has(file.id) ? onUnselect?.(file) : onSelect?.(file);

  const previewFile = files.find((file) => file.id === previewId);
  const selectedFiles = files.filter((file) => selectedIds.has(file.id));

  const audioFiles = files.filter((file) => tabForKind(file.kind) === "audio");
  const galleryFiles = files.filter((file) => tabForKind(file.kind) === "gallery");
  const miscFiles = files.filter((file) => tabForKind(file.kind) === "misc");
  const audioPending = pendingFiles.filter((file) => tabForKind(file.kind) === "audio");
  const galleryPending = pendingFiles.filter((file) => tabForKind(file.kind) === "gallery");
  const miscPending = pendingFiles.filter((file) => tabForKind(file.kind) === "misc");

  const openGalleryPreview = (id: string) => {
    const index = galleryFiles.findIndex((file) => file.id === id);
    if (index !== -1) setCarouselIndex(index);
  };

  const sharedProps = {
    failedIds,
    selectedIds,
    onToggleSelect,
    onOpen: setPreviewId,
    onPlayAudio,
    onRename,
    onDownload,
    onDelete,
    onSetAudioRole,
    onClearAudioRole,
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AttachmentTab)}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="audio">
              <Trans>Audio ({audioFiles.length + audioPending.length})</Trans>
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Trans>Gallery ({galleryFiles.length + galleryPending.length})</Trans>
            </TabsTrigger>
            <TabsTrigger value="misc">
              <Trans>Misc ({miscFiles.length + miscPending.length})</Trans>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1.5">
            {actions}
            {selectedFiles.length > 0 && onDeleteSelected && (
              <AttachmentSelectionMenu files={selectedFiles} onDeleteSelected={onDeleteSelected} />
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[420px]">
          <TabsContent value="audio">
            <AttachmentListItems files={audioFiles} pendingFiles={audioPending} {...sharedProps} />
          </TabsContent>
          <TabsContent value="gallery">
            <AttachmentGalleryGrid
              files={galleryFiles}
              pendingFiles={galleryPending}
              failedIds={failedIds}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onOpen={openGalleryPreview}
              onRename={onRename}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </TabsContent>
          <TabsContent value="misc">
            <AttachmentListItems files={miscFiles} pendingFiles={miscPending} {...sharedProps} />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <FilePreviewDialog
        file={previewFile ?? null}
        failed={previewFile !== undefined && failedIds.has(previewFile.id)}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onError={() => previewFile && markFailed(previewFile.id)}
        onDownload={() => previewFile && onDownload?.(previewFile)}
      />

      <AttachmentCarouselDialog
        files={galleryFiles}
        openIndex={carouselIndex}
        onOpenChange={(open) => !open && setCarouselIndex(null)}
      />
    </>
  );
}
