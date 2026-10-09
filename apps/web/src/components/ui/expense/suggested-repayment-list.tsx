import { ArrowRight, CircleCheck } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export interface SuggestedRepaymentEntry {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountMinor: number;
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
  const { t, i18n } = useLingui();

  if (entries.length === 0) {
    return (
      <p className="m-0 flex items-center gap-2 text-sm text-muted-foreground">
        <CircleCheck className="size-4" />
        {t`Everyone is settled up.`}
      </p>
    );
  }

  return (
    <ul className="m-0 flex flex-col p-0">
      {entries.map((entry) => (
        <li
          key={`${entry.fromUserId}-${entry.toUserId}`}
          className="m-0 flex list-none items-center gap-3 border-t py-2.5 text-sm first:border-t-0 first:pt-0"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5 font-medium">
              {entry.fromName}
              <ArrowRight aria-hidden className="size-3.5 text-muted-foreground" />
              {entry.toName}
            </span>
            <span className="font-bold tabular-nums">
              {formatMoney(entry.amountMinor, currency, i18n.locale)}
            </span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => onRecord(entry)}>
            {t`Record`}
          </Button>
        </li>
      ))}
    </ul>
  );
}
