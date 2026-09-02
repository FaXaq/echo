import { useState } from "react";
import { Music, MoreVertical, Share2 } from "lucide-react";
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
import { LyricsEditor } from "@/components/ui/lyrics-editor";
import type { Song } from "@/services/resources/song";

export interface SongDetailProps {
  song: Song;
  lyrics: string;
  onLyricsChange: (markdown: string) => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  attachments: React.ReactNode;
  className?: string;
}

export function SongDetail({
  song,
  lyrics,
  onLyricsChange,
  onShare,
  onEdit,
  onDelete,
  attachments,
  className,
}: SongDetailProps) {
  const { t } = useLingui();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const typeLabel = song.type === "original" ? t`Original` : song.type === "cover" ? t`Cover` : "—";

  const sidebarItems: SidebarItem[] = [
    { label: t`Artist`, value: song.artist ?? "—" },
    { label: t`BPM`, value: song.bpm ?? "—" },
    { label: t`Key`, value: song.key ?? "—" },
    { label: t`Type`, value: typeLabel },
    { label: t`Added by`, value: song.createdByName },
  ];

  return (
    <>
      <EntityDetailLayout
        icon={
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-muted">
            <Music className="size-4" />
          </span>
        }
        title={song.title}
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t`Share`}
              onClick={onShare}
            >
              <Share2 />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={t`Song actions`}
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
        attachments={attachments}
        className={className}
      >
        <LyricsEditor markdown={lyrics} onChange={onLyricsChange} />
      </EntityDetailLayout>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t`Delete song?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t`This will permanently delete this song. This action cannot be undone.`}
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
