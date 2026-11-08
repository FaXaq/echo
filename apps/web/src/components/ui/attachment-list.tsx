import { useState, type ReactNode } from "react";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import {
  AudioLines,
  Check,
  DownloadIcon,
  Info,
  FileWarning,
  ImageOff,
  ListChecks,
  MoreVertical,
  Paperclip,
  Music,
  Pen,
  Play,
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
import { ListEmptyState } from "@/components/ui/list-empty-state";
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fileTypeLabel, formatDuration, formatSize } from "@/lib/file";
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
  durationSeconds?: number | null;
  downloadUrl: string;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  role?: Role | null;
  version?: number | null;
}

function formatFileMeta(file: Pick<AttachmentFile, "sizeBytes" | "durationSeconds">): string {
  const size = formatSize(file.sizeBytes);
  return file.durationSeconds != null ? `${size} · ${formatDuration(file.durationSeconds)}` : size;
}

const AUDIO_GRID = "gap-2.5 grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]";
const MISC_GRID = "gap-x-6 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]";
const ROW = "h-11 w-full min-w-0 flex-nowrap gap-2.5 rounded-none border-0 border-b";
const ROW_TITLE = "text-[13px]";
const ROW_META = "mt-0 max-w-none shrink-0 tabular-nums";
const INVERTED_MEDIA = "bg-primary text-primary-foreground";
const FILE_TYPE_MEDIA = "font-mono text-[9px] font-semibold";
const TILE =
  "w-full gap-0 overflow-hidden rounded-md border-0 has-data-[slot=attachment-content]:w-full has-data-[slot=attachment-content]:p-0 has-data-[slot=attachment-media]:p-0";
const TILE_CAPTION =
  "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-primary py-0.5 text-xs text-primary-foreground opacity-0 transition-opacity group-hover/attachment:opacity-100 group-data-[state=error]/attachment:opacity-100 group-data-[state=uploading]/attachment:opacity-100 group-data-[orientation=vertical]/attachment:px-1.5";
const TILE_CHIP =
  "pointer-events-none absolute start-1 bottom-1 z-20 flex items-center gap-0.5 rounded-sm bg-primary px-1 text-[11px] text-primary-foreground tabular-nums transition-opacity group-hover/attachment:opacity-0";
// Row meta and tile captions give way to the actions on hover; touch screens always show them.
const FADE_OUT_FOR_ACTIONS =
  "transition-opacity pointer-fine:group-hover/attachment:opacity-0 pointer-fine:group-focus-within/attachment:opacity-0 pointer-fine:group-has-data-popup-open/attachment:opacity-0";
const REVEAL_ACTIONS =
  "transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover/attachment:opacity-100 pointer-fine:group-focus-within/attachment:opacity-100 pointer-fine:group-has-data-popup-open/attachment:opacity-100";
const ROW_ACTIONS = `static pointer-fine:absolute pointer-fine:end-1 pointer-fine:top-1/2 pointer-fine:-translate-y-1/2 ${REVEAL_ACTIONS}`;
const TILE_ACTIONS = `group-data-[orientation=vertical]/attachment:top-1 group-data-[orientation=vertical]/attachment:end-1 ${REVEAL_ACTIONS}`;

export interface AttachmentListProps<F extends AttachmentFile> {
  files: F[];
  pendingFiles?: PendingAttachment[];
  actions?: ReactNode;
  selectedIds?: Set<string>;
  playingFileId?: string;
  onSelect?: (file: F) => void;
  onUnselect?: (file: F) => void;
  onDeleteSelected?: (files: F[]) => Promise<void>;
  onDelete?: (file: F) => void;
  onRename?: (file: F) => void;
  onLinkToSong?: (file: F) => void;
  onDownload?: (file: F) => void;
  onShowDetails?: (file: F) => void;
  onPlayAudio?: (file: F) => void;
  onSetAudioRole?: (file: F, role: Role) => void;
  onClearAudioRole?: (file: F) => void;
}

type AttachmentTab = "audio" | "gallery" | "misc";

const TAB_ORDER: AttachmentTab[] = ["audio", "gallery", "misc"];
const EMPTY_SELECTION: Set<string> = new Set();

// macOS turns Ctrl+click into a contextmenu event; a real right-click reports button 2.
const isMacCtrlClick = (event: { ctrlKey: boolean; button: number }) =>
  event.ctrlKey && event.button === 0;

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
  dense = false,
  failedIds,
  selectedIds,
  playingFileId,
  onToggleSelect,
  onOpen,
  onPlayAudio,
  onRename,
  onLinkToSong,
  onDownload,
  onShowDetails,
  onDelete,
  onSetAudioRole,
  onClearAudioRole,
}: {
  files: F[];
  pendingFiles: PendingAttachment[];
  dense?: boolean;
  failedIds: Set<string>;
  selectedIds: Set<string>;
  playingFileId?: string;
  onToggleSelect: (file: F) => void;
  onOpen: (id: string) => void;
  onPlayAudio?: (file: F) => void;
  onRename?: (file: F) => void;
  onLinkToSong?: (file: F) => void;
  onDownload?: (file: F) => void;
  onShowDetails?: (file: F) => void;
  onDelete?: (file: F) => void;
  onSetAudioRole?: (file: F, role: Role) => void;
  onClearAudioRole?: (file: F) => void;
}) {
  const { t } = useLingui();
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  if (files.length === 0 && pendingFiles.length === 0) {
    return (
      <ListEmptyState
        icon={<Paperclip />}
        title={t`No files yet`}
        description={t`Upload files with the button above.`}
      />
    );
  }

  return (
    <ul className={cn("m-0 grid p-0", dense ? MISC_GRID : AUDIO_GRID)}>
      {pendingFiles.map((file) => (
        <li key={file.key} className="m-0 min-w-0 list-none p-0">
          <Attachment
            orientation="horizontal"
            className={dense ? ROW : "w-full"}
            state="uploading"
            size={dense ? "xs" : "sm"}
          >
            <AttachmentMedia>
              <Spinner />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle className={cn(dense && ROW_TITLE)}>{file.filename}</AttachmentTitle>
              {!dense && <AttachmentDescription>{t`Uploading…`}</AttachmentDescription>}
            </AttachmentContent>
            {dense && (
              <AttachmentDescription className={ROW_META}>{t`Uploading…`}</AttachmentDescription>
            )}
          </Attachment>
        </li>
      ))}
      {files.map((file) => {
        const failed = failedIds.has(file.id);
        const selected = selectedIds.has(file.id);
        const playing = file.id === playingFileId;
        return (
          <li key={file.id} className="m-0 min-w-0 list-none p-0">
            <Attachment
              orientation="horizontal"
              className={dense ? ROW : "w-full"}
              state={failed ? "error" : selected ? "selected" : "done"}
              size={dense ? "xs" : "sm"}
              onContextMenu={(event) => {
                event.preventDefault();
                if (isMacCtrlClick(event)) onToggleSelect(file);
                else setContextMenuId(file.id);
              }}
            >
              <AttachmentTrigger
                aria-label={t`Open ${file.filename}`}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || selectedIds.size > 0) {
                    event.preventDefault();
                    onToggleSelect(file);
                    return;
                  }
                  if (file.kind === "audio" && onPlayAudio) onPlayAudio(file);
                  else onOpen(file.id);
                }}
              />
              <AttachmentMedia
                className={cn(
                  file.kind !== "audio" && FILE_TYPE_MEDIA,
                  (selected || playing) && INVERTED_MEDIA,
                )}
              >
                {match({ failed, selected, playing, kind: file.kind })
                  .with({ selected: true }, () => <Check />)
                  .with({ failed: true }, () => <FileWarning />)
                  .with({ playing: true }, () => <AudioLines />)
                  .with({ kind: "audio" }, () => <Music />)
                  .otherwise(() => fileTypeLabel(file.filename))}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className={cn("flex items-center gap-1.5", dense && ROW_TITLE)}>
                  <span className="truncate">{file.filename}</span>
                  {file.role && (
                    <Badge variant="secondary" className="shrink-0">
                      {file.role === "demo" ? t`Demo` : t`Final`}
                      {file.version != null && ` v${file.version}`}
                    </Badge>
                  )}
                </AttachmentTitle>
                {!dense && (
                  <AttachmentDescription>
                    {failed ? t`Couldn't load this file` : formatFileMeta(file)}
                  </AttachmentDescription>
                )}
              </AttachmentContent>
              {dense && (
                <AttachmentDescription className={cn(ROW_META, FADE_OUT_FOR_ACTIONS)}>
                  {failed ? t`Couldn't load this file` : formatFileMeta(file)}
                </AttachmentDescription>
              )}
              <AttachmentActions className={cn(dense && ROW_ACTIONS)}>
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
                    {(onRename ||
                      onLinkToSong ||
                      onDownload ||
                      onShowDetails ||
                      onDelete ||
                      onSetAudioRole ||
                      onClearAudioRole) && <DropdownMenuSeparator />}
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
                    {onLinkToSong && (
                      <DropdownMenuItem onClick={() => onLinkToSong(file)}>
                        <Music />
                        {t`Link to a song`}
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
                    {onShowDetails && (
                      <DropdownMenuItem onClick={() => onShowDetails(file)}>
                        <Info />
                        {t`Details`}
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
  failedThumbnailUrls,
  onThumbnailError,
  selectedIds,
  onToggleSelect,
  onOpen,
  onRename,
  onLinkToSong,
  onDownload,
  onShowDetails,
  onDelete,
}: {
  files: F[];
  pendingFiles: PendingAttachment[];
  failedThumbnailUrls: Set<string>;
  onThumbnailError: (url: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (file: F) => void;
  onOpen: (id: string) => void;
  onRename?: (file: F) => void;
  onLinkToSong?: (file: F) => void;
  onDownload?: (file: F) => void;
  onShowDetails?: (file: F) => void;
  onDelete?: (file: F) => void;
}) {
  const { t } = useLingui();
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  if (files.length === 0 && pendingFiles.length === 0) {
    return (
      <ListEmptyState
        icon={<Paperclip />}
        title={t`No files yet`}
        description={t`Upload files with the button above.`}
      />
    );
  }

  return (
    <ul className="m-0 grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1 p-0">
      {pendingFiles.map((file) => (
        <li key={file.key} className="m-0 min-w-0 list-none p-0">
          <Attachment orientation="vertical" className={TILE} state="uploading">
            <AttachmentMedia className="rounded-md">
              <Spinner />
            </AttachmentMedia>
            <AttachmentContent className={TILE_CAPTION}>
              <AttachmentTitle>{file.filename}</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        </li>
      ))}
      {files.map((file) => {
        const thumbnailUrl =
          file.thumbnailUrl && !failedThumbnailUrls.has(file.thumbnailUrl)
            ? file.thumbnailUrl
            : null;
        const selected = selectedIds.has(file.id);
        return (
          <li key={file.id} className="m-0 min-w-0 list-none p-0">
            <Attachment
              orientation="vertical"
              className={TILE}
              state={selected ? "selected" : "done"}
              size="default"
              onContextMenu={(event) => {
                event.preventDefault();
                if (isMacCtrlClick(event)) onToggleSelect(file);
                else setContextMenuId(file.id);
              }}
            >
              <AttachmentTrigger
                aria-label={t`Open ${file.filename}`}
                onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || selectedIds.size > 0) {
                    event.preventDefault();
                    onToggleSelect(file);
                    return;
                  }
                  onOpen(file.id);
                }}
              />
              <AttachmentMedia variant={thumbnailUrl ? "image" : "icon"} className="rounded-md">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={file.filename}
                    loading="lazy"
                    onError={() => onThumbnailError(thumbnailUrl)}
                    className="m-0 block"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 px-1 text-center text-[11px] text-muted-foreground">
                    <ImageOff className="size-5" />
                    <Trans>No thumbnail</Trans>
                  </span>
                )}
              </AttachmentMedia>
              {selected && (
                <span className="pointer-events-none absolute inset-0 z-20 rounded-md bg-primary/30 p-1.5 ring-3 ring-primary ring-inset">
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>
                </span>
              )}
              {file.kind === "video" && (
                <span className={TILE_CHIP}>
                  <Play className="size-2 fill-current" />
                  {file.durationSeconds != null && formatDuration(file.durationSeconds)}
                </span>
              )}
              {(file.previewUrl || file.mimeType === "image/gif") && (
                <span className={TILE_CHIP}>{fileTypeLabel(file.filename)}</span>
              )}
              <AttachmentContent className={TILE_CAPTION}>
                <AttachmentTitle>{file.filename}</AttachmentTitle>
              </AttachmentContent>
              <AttachmentActions className={TILE_ACTIONS}>
                <DropdownMenu
                  open={contextMenuId === file.id}
                  onOpenChange={(open) => setContextMenuId(open ? file.id : null)}
                >
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="secondary"
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
                    {(onRename || onLinkToSong || onDownload || onShowDetails || onDelete) && (
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
                    {onLinkToSong && (
                      <DropdownMenuItem onClick={() => onLinkToSong(file)}>
                        <Music />
                        {t`Link to a song`}
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
                    {onShowDetails && (
                      <DropdownMenuItem onClick={() => onShowDetails(file)}>
                        <Info />
                        {t`Details`}
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
  playingFileId,
  onSelect,
  onUnselect,
  onDeleteSelected,
  onDelete,
  onRename,
  onLinkToSong,
  onDownload,
  onShowDetails,
  onPlayAudio,
  onSetAudioRole,
  onClearAudioRole,
}: AttachmentListProps<F>) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [failedThumbnailUrls, setFailedThumbnailUrls] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<AttachmentTab>(() =>
    firstNonEmptyTab(files, pendingFiles),
  );

  const markFailed = (id: string) =>
    setFailedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  // Keyed by URL so a re-signed thumbnail gets another try after a refetch.
  const markThumbnailFailed = (url: string) =>
    setFailedThumbnailUrls((prev) => new Set(prev).add(url));

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
    playingFileId,
    onToggleSelect,
    onOpen: setPreviewId,
    onPlayAudio,
    onRename,
    onLinkToSong,
    onDownload,
    onShowDetails,
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
        <TabsContent value="audio">
          <AttachmentListItems files={audioFiles} pendingFiles={audioPending} {...sharedProps} />
        </TabsContent>
        <TabsContent value="gallery">
          <AttachmentGalleryGrid
            files={galleryFiles}
            pendingFiles={galleryPending}
            failedThumbnailUrls={failedThumbnailUrls}
            onThumbnailError={markThumbnailFailed}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onOpen={openGalleryPreview}
            onRename={onRename}
            onLinkToSong={onLinkToSong}
            onDownload={onDownload}
            onShowDetails={onShowDetails}
            onDelete={onDelete}
          />
        </TabsContent>
        <TabsContent value="misc">
          <AttachmentListItems
            files={miscFiles}
            pendingFiles={miscPending}
            dense
            {...sharedProps}
          />
        </TabsContent>
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
