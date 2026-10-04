import { useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface BalanceListEntry {
  userId: string;
  name: string;
  isMember: boolean;
  amountMinor: number;
}

function BalanceRow({ entry, currency }: { entry: BalanceListEntry; currency: string }) {
  const { t, i18n } = useLingui();
  const amount = formatMoney(Math.abs(entry.amountMinor), currency, i18n.locale);
  const label =
    entry.amountMinor === 0
      ? t`Settled`
      : entry.amountMinor > 0
        ? t`Is owed ${amount}`
        : t`Owes ${amount}`;

  return (
    <li className="m-0 flex list-none items-center gap-2 p-0 text-sm">
      <span className="font-medium">{entry.name}</span>
      {!entry.isMember && <Badge variant="outline">{t`Former member`}</Badge>}
      <span
        className={cn(
          "ml-auto tabular-nums",
          entry.amountMinor > 0 && "text-emerald-600 dark:text-emerald-400",
          entry.amountMinor < 0 && "text-destructive",
        )}
      >
        {label}
      </span>
    </li>
  );
}

export function BalanceList({
  entries,
  currency,
}: {
  entries: BalanceListEntry[];
  currency: string;
}) {
  return (
    <ul className="m-0 flex flex-col gap-1.5 p-0">
      {entries.map((entry) => (
        <BalanceRow key={entry.userId} entry={entry} currency={currency} />
      ))}
    </ul>
  );
}
