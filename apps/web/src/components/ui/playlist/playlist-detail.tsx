import { useState } from "react";
import { Layers, ListMusic, MoreVertical, Play, Plus } from "lucide-react";
import { useLingui } from "@lingui/react/macro";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityDetailLayout, type SidebarItem } from "@/components/ui/entity-detail-layout";
import { Input } from "@/components/ui/input";
import { MarkdownEditor, type MarkdownSaveStatus } from "@/components/ui/markdown-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Playlist } from "@/services/resources/playlist";
import { formatDuration } from "@/lib/file";

export interface PlaylistDetailProps {
  playlist: Playlist;
  description: string;
  onDescriptionChange: (markdown: string) => void;
  onDescriptionBlur: () => void;
  descriptionSaveStatus?: MarkdownSaveStatus;
  intervalSeconds: number | null;
  onIntervalChange: (seconds: number | null) => void;
  onIntervalBlur: () => void;
  songsList: React.ReactNode;
  addSongPicker: React.ReactNode;
  durationInSeconds?: number;
  onEdit: () => void;
  onDelete: () => void;
  onPlayPlaylist: () => void;
  className?: string;
}

export function PlaylistDetail({
  playlist,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  descriptionSaveStatus,
  intervalSeconds,
  onIntervalChange,
  onIntervalBlur,
  songsList,
  addSongPicker,
  onEdit,
  onDelete,
  onPlayPlaylist,
  className,
  durationInSeconds,
}: PlaylistDetailProps) {
  const { t } = useLingui();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [{ label: t`Created by`, value: playlist.createdByName }];

  return (
    <>
      <EntityDetailLayout
        icon={
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-muted">
            <ListMusic className="size-4" />
          </span>
        }
        title={playlist.title}
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t`Play playlist`}
              onClick={onPlayPlaylist}
            >
              <Play />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t`Playlist actions`}
                  />
                }
              >
                <MoreVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>{t`Update`}</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  {t`Delete`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        sidebarItems={sidebarItems}
        attachments={null}
        className={className}
      >
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">{t`Description`}</span>
          <MarkdownEditor
            markdown={description}
            onChange={onDescriptionChange}
            onBlur={onDescriptionBlur}
            placeholder={t`Add a description…`}
            saveStatus={descriptionSaveStatus}
            className="min-h-24 max-h-[32rem] rounded-lg border px-4 py-3 text-sm leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Layers className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">{t`Interval between songs`}</span>
          <Input
            type="number"
            min={0}
            step={1}
            value={intervalSeconds ?? ""}
            placeholder="0"
            className="h-7 w-20"
            onChange={(event) => {
              const raw = event.target.value;
              onIntervalChange(raw === "" ? null : Math.max(0, Number(raw)));
            }}
            onBlur={onIntervalBlur}
          />
          <span className="text-[11px] text-muted-foreground">{t`seconds`}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-baseline gap-2">
              {!!durationInSeconds && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(durationInSeconds)}
                </span>
              )}
            </div>
            <Popover>
              <PopoverTrigger
                render={
                  <Button type="button" variant="outline" size="icon-xs" aria-label={t`Add song`} />
                }
              >
                <Plus />
              </PopoverTrigger>
              <PopoverContent align="end">{addSongPicker}</PopoverContent>
            </Popover>
          </div>
          {songsList}
        </div>
      </EntityDetailLayout>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Delete playlist?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`This will permanently delete this playlist. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteConfirmOpen(false);
                onDelete();
              }}
            >
              {t`Delete`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
