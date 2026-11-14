import { useEffect, useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { EventPickerCombobox } from "@/components/features/event-calendar/event-picker-combobox";
import { useAddOccurrencesMutation } from "@/services/resources/drive";

type LinkableFile = { id: string; filename: string };

export function LinkFileToEventDialog({
  files: requestedFiles,
  organizationId,
  onOpenChange,
  onLinked,
}: {
  files: LinkableFile[];
  organizationId: string;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
}) {
  const { t } = useLingui();
  const addMutation = useAddOccurrencesMutation();

  const [files, setFiles] = useState(requestedFiles);
  useEffect(() => {
    if (requestedFiles.length > 0) setFiles(requestedFiles);
  }, [requestedFiles]);
  const count = files.length;

  const linkAll = (eventId: string) =>
    addMutation.mutate(
      {
        fileIds: files.map((file) => file.id),
        place: { kind: "event", id: eventId },
        organizationId,
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title:
              count === 1 ? t`File assigned to the event` : t`${count} files assigned to the event`,
          });
          onOpenChange(false);
          onLinked?.();
        },
        onError: () =>
          toast.add({
            type: "error",
            title: count === 1 ? t`Couldn't assign the file` : t`Couldn't assign the files`,
          }),
      },
    );

  return (
    <Dialog open={requestedFiles.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {count === 1
              ? t`Assign ${files[0].filename} to an event`
              : t`Assign ${count} files to an event`}
          </DialogTitle>
        </DialogHeader>
        <EventPickerCombobox organizationId={organizationId} onSelect={linkAll} />
      </DialogContent>
    </Dialog>
  );
}
