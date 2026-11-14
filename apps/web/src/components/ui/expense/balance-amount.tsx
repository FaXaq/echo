import { useLingui } from "@lingui/react/macro";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

// amountMinor follows computeBalances: positive = owed money, negative = owes.
export function BalanceAmount({
  amountMinor,
  currency,
  className,
}: {
  amountMinor: number;
  currency: string;
  className?: string;
}) {
  const { i18n } = useLingui();
  const amount = formatMoney(Math.abs(amountMinor), currency, i18n.locale);
  const sign = amountMinor > 0 ? "+ " : amountMinor < 0 ? "- " : "";

  return (
    <span
      className={cn(
        "font-heading font-semibold tabular-nums",
        amountMinor > 0 && "text-emerald-600 dark:text-emerald-400",
        amountMinor < 0 && "text-destructive",
        className,
      )}
    >
      {sign}
      {amount}
    </span>
  );
}
