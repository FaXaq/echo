import { useLingui } from "@lingui/react/macro";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { EventPickerCombobox } from "@/components/features/event-calendar/event-picker-combobox";
import { useLinkFileToEventMutation } from "@/services/resources/drive";

export function LinkFileToEventDialog({
  file,
  organizationId,
  onOpenChange,
}: {
  file: { id: string; filename: string } | null;
  organizationId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLingui();
  const linkMutation = useLinkFileToEventMutation({
    onSuccess: () => {
      toast.add({ type: "success", title: t`File assigned to the event` });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Assign ${file?.filename ?? ""} to an event`}</DialogTitle>
        </DialogHeader>
        <EventPickerCombobox
          organizationId={organizationId}
          onSelect={(eventId) => {
            if (!file) return;
            linkMutation.mutate(
              { fileId: file.id, eventId, organizationId },
              { onError: () => toast.add({ type: "error", title: t`Couldn't assign the file` }) },
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
