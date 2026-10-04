import { useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";
import { Blobatar } from "@/components/ui/blobatar";
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
    entry.amountMinor === 0 ? t`-` : entry.amountMinor > 0 ? t`+ ${amount}` : t`- ${amount}`;

  return (
    <li className="m-0 flex list-none items-center gap-2 p-0 text-sm">
      <Badge variant="secondary" className="h-6 gap-1.5 ps-0.5 text-sm">
        <Blobatar name={entry.name} className="size-5" />
        {entry.name}
      </Badge>
      {!entry.isMember && <Badge variant="outline">{t`Former member`}</Badge>}
      <span
        className={cn(
          "ml-auto tabular-nums font-bold",
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
