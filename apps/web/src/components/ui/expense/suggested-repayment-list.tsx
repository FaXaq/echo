import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export interface SuggestedRepaymentEntry {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountMinor: number;
}

function SuggestedRepaymentRow({
  entry,
  currency,
  onRecord,
}: {
  entry: SuggestedRepaymentEntry;
  currency: string;
  onRecord: (entry: SuggestedRepaymentEntry) => void;
}) {
  const { t, i18n } = useLingui();
  const { fromName, toName } = entry;

  return (
    <li className="m-0 flex list-none items-center gap-2 p-0 text-sm">
      <span>
        <Trans>
          {fromName} pays {toName}
        </Trans>
      </span>
      <span className="ml-auto font-medium tabular-nums">
        {formatMoney(entry.amountMinor, currency, i18n.locale)}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => onRecord(entry)}>
        {t`Record`}
      </Button>
    </li>
  );
}

export function SuggestedRepaymentList({
  entries,
  currency,
  onRecord,
}: {
  entries: SuggestedRepaymentEntry[];
  currency: string;
  onRecord: (entry: SuggestedRepaymentEntry) => void;
}) {
  const { t } = useLingui();

  if (entries.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">{t`Everyone is settled up.`}</p>;
  }

  return (
    <ul className="m-0 flex flex-col gap-2 p-0">
      {entries.map((entry) => (
        <SuggestedRepaymentRow
          key={`${entry.fromUserId}-${entry.toUserId}`}
          entry={entry}
          currency={currency}
          onRecord={onRecord}
        />
      ))}
    </ul>
  );
}
