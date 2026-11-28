import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { locationKey } from "@/lib/drive-location";
import {
  type RemoveManyCounts,
  type RemoveOccurrenceOutcome,
  useOccurrencePathLabel,
} from "./use-remove-occurrence";

export function RemoveOccurrenceDialog({
  open,
  outcome,
  placeName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
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
      open={open && outcome !== null}
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

export function RemoveManyOccurrencesDialog({
  open,
  counts,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  counts: RemoveManyCounts | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useLingui();
  const removedCount = counts?.removedCount ?? 0;
  const deletedCount = counts?.deletedCount ?? 0;
  const total = removedCount + deletedCount;

  return (
    <ConfirmDialog
      open={open && counts !== null}
      onOpenChange={onOpenChange}
      variant="destructive"
      title={
        removedCount === 0 ? (
          <Plural
            value={total}
            one="Permanently delete # file?"
            other="Permanently delete # files?"
          />
        ) : (
          <Plural value={total} one="Remove # file?" other="Remove # files?" />
        )
      }
      description={
        <>
          {removedCount > 0 && (
            <p>
              <Plural
                value={removedCount}
                one="# file will be removed from here and stays in other places"
                other="# files will be removed from here and stay in other places"
              />
            </p>
          )}
          {deletedCount > 0 && (
            <p>
              <Plural
                value={deletedCount}
                one="# file will be permanently deleted"
                other="# files will be permanently deleted"
              />
              {". "}
              <Trans>This action cannot be undone.</Trans>
            </p>
          )}
        </>
      }
      confirmLabel={removedCount === 0 ? t`Permanently delete` : t`Remove`}
      onConfirm={onConfirm}
    />
  );
}
