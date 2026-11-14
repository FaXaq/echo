import { useLingui } from "@lingui/react/macro";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useAddOccurrencesMutation } from "@/services/resources/drive";
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
  const addMutation = useAddOccurrencesMutation({
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
            addMutation.mutate(
              { fileIds: [file.id], place: { kind: "song", id: songId }, organizationId },
              { onError: () => toast.add({ type: "error", title: t`Couldn't link the file` }) },
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
