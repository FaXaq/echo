import type { ReactNode } from "react";
import { Plural, useLingui } from "@lingui/react/macro";
import { formatMoney } from "@/lib/money";
import { BalanceAmount } from "./balance-amount";

export interface LedgerStatsProps {
  currency: string;
  totalSpentMinor: number;
  expenseCount: number;
  yourBalanceMinor: number;
  toSettleMinor: number;
  settleCount: number;
}

function Stat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card px-4 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-heading text-2xl font-semibold tabular-nums">{value}</span>
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
        value={<BalanceAmount amountMinor={yourBalanceMinor} currency={currency} />}
        hint={
          yourBalanceMinor > 0
            ? t`You are owed`
            : yourBalanceMinor < 0
              ? t`You owe`
              : t`You are settled up`
        }
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
