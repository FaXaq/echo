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

function BalanceRow({
  entry,
  currency,
  maxMinor,
}: {
  entry: BalanceListEntry;
  currency: string;
  maxMinor: number;
}) {
  const { t, i18n } = useLingui();
  const amount = formatMoney(Math.abs(entry.amountMinor), currency, i18n.locale);
  const label =
    entry.amountMinor === 0 ? t`-` : entry.amountMinor > 0 ? t`+ ${amount}` : t`- ${amount}`;
  const width = `${(Math.abs(entry.amountMinor) / maxMinor) * 100}%`;

  return (
    <li className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
      <div className="flex items-center gap-2">
        <Blobatar name={entry.name} className="size-6" />
        <span className="font-medium">{entry.name}</span>
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
      </div>
      <div aria-hidden className="grid h-1.5 grid-cols-2 gap-0.5">
        <div className="flex justify-end overflow-hidden rounded-s-full bg-muted">
          {entry.amountMinor < 0 && <div className="bg-destructive" style={{ width }} />}
        </div>
        <div className="flex overflow-hidden rounded-e-full bg-muted">
          {entry.amountMinor > 0 && (
            <div className="bg-emerald-600 dark:bg-emerald-400" style={{ width }} />
          )}
        </div>
      </div>
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
  const maxMinor = Math.max(1, ...entries.map((entry) => Math.abs(entry.amountMinor)));

  return (
    <ul className="m-0 flex flex-col gap-3 p-0">
      {entries.map((entry) => (
        <BalanceRow key={entry.userId} entry={entry} currency={currency} maxMinor={maxMinor} />
      ))}
    </ul>
  );
}
