import { Trans, useLingui } from "@lingui/react/macro";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { locationKey } from "@/lib/drive-location";
import { type RemoveOccurrenceOutcome, useOccurrencePathLabel } from "./use-remove-occurrence";

export function RemoveOccurrenceDialog({
  outcome,
  placeName,
  onOpenChange,
  onConfirm,
}: {
  outcome: RemoveOccurrenceOutcome | null;
  placeName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useLingui();
  const pathLabel = useOccurrencePathLabel();
  const isLast = outcome?.isLast ?? false;

  return (
    <ConfirmDialog
      open={outcome !== null}
      onOpenChange={onOpenChange}
      variant="destructive"
      title={isLast ? t`Permanently delete this file?` : t`Remove from ${placeName}?`}
      description={
        isLast ? (
          t`This is the file's only place, so it will be permanently deleted. This action cannot be undone.`
        ) : (
          <>
            <Trans>The file stays in:</Trans>
            <ul className="mt-2 list-disc pl-5">
              {outcome?.remaining.map((entry) => (
                <li key={locationKey(entry.place)}>{pathLabel(entry)}</li>
              ))}
            </ul>
          </>
        )
      }
      confirmLabel={isLast ? t`Permanently delete` : t`Remove`}
      onConfirm={onConfirm}
    />
  );
}
