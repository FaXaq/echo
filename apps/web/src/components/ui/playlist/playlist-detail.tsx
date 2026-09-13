import { useState } from "react";
import { ListMusic, MoreVertical } from "lucide-react";
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
import type { Playlist } from "@/services/resources/playlist";

export interface PlaylistDetailProps {
  playlist: Playlist;
  songsPicker: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

export function PlaylistDetail({
  playlist,
  songsPicker,
  onDelete,
  className,
}: PlaylistDetailProps) {
  const { t } = useLingui();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { label: t`Description`, value: playlist.description ?? "—" },
    { label: t`Created by`, value: playlist.createdByName },
  ];

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
          <h2 className="text-sm font-medium text-muted-foreground">{t`Songs`}</h2>
          {songsPicker}
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
