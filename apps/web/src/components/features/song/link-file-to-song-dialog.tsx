import { useLingui } from "@lingui/react/macro";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useLinkFileToSongMutation } from "@/services/resources/drive";
import { SongPickerCombobox } from "@/components/features/playlist/song-picker-combobox";

export function LinkFileToSongDialog({
  file,
  organizationId,
  onOpenChange,
}: {
  file: { id: string; filename: string } | null;
  organizationId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLingui();
  const linkMutation = useLinkFileToSongMutation({
    onSuccess: () => {
      toast.add({ type: "success", title: t`File linked to the song` });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Link ${file?.filename ?? ""} to a song`}</DialogTitle>
        </DialogHeader>
        <SongPickerCombobox
          organizationId={organizationId}
          selectedSongs={[]}
          onAdd={(songId) => {
            if (!file) return;
            linkMutation.mutate(
              { fileId: file.id, songId, organizationId },
              { onError: () => toast.add({ type: "error", title: t`Couldn't link the file` }) },
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
