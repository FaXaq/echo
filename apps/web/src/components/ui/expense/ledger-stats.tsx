import type { ReactNode } from "react";
import { Plural, useLingui } from "@lingui/react/macro";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface LedgerStatsProps {
  currency: string;
  totalSpentMinor: number;
  expenseCount: number;
  yourBalanceMinor: number;
  toSettleMinor: number;
  settleCount: number;
}

function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: string;
  hint: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("font-heading text-2xl font-semibold tabular-nums", className)}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

export function LedgerStats({
  currency,
  totalSpentMinor,
  expenseCount,
  yourBalanceMinor,
  toSettleMinor,
  settleCount,
}: LedgerStatsProps) {
  const { t, i18n } = useLingui();
  const format = (amountMinor: number) => formatMoney(amountMinor, currency, i18n.locale);
  const balance = format(Math.abs(yourBalanceMinor));

  return (
    <section
      aria-label={t`Summary`}
      className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-3"
    >
      <Stat
        label={t`Total spent`}
        value={format(totalSpentMinor)}
        hint={<Plural value={expenseCount} one="# expense" other="# expenses" />}
      />
      <Stat
        label={t`Your balance`}
        value={
          yourBalanceMinor > 0 ? `+ ${balance}` : yourBalanceMinor < 0 ? `- ${balance}` : balance
        }
        hint={
          yourBalanceMinor > 0
            ? t`You are owed`
            : yourBalanceMinor < 0
              ? t`You owe`
              : t`You are settled up`
        }
        className={cn(
          yourBalanceMinor > 0 && "text-emerald-600 dark:text-emerald-400",
          yourBalanceMinor < 0 && "text-destructive",
        )}
      />
      <Stat
        label={t`Left to settle`}
        value={format(toSettleMinor)}
        hint={
          <Plural
            value={settleCount}
            _0="Nothing to settle"
            one="# repayment settles everyone"
            other="# repayments settle everyone"
          />
        }
      />
    </section>
  );
}
