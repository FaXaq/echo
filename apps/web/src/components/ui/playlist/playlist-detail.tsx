import { useState } from "react";
import { ListMusic, MoreVertical, Plus } from "lucide-react";
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
  songsList: React.ReactNode;
  addSongPicker: React.ReactNode;
  durationInSeconds?: number;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function PlaylistDetail({
  playlist,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  descriptionSaveStatus,
  songsList,
  addSongPicker,
  onEdit,
  onDelete,
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
