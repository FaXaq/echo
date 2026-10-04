import "@/lib/dayjs";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/money";
import type { Expense } from "@/services/resources/expense";

export interface ExpenseListItemProps {
  expense: Expense;
  payerName: string;
  organizationCurrency: string;
  eventTitle?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseListItem({
  expense,
  payerName,
  organizationCurrency,
  eventTitle,
  onEdit,
  onDelete,
}: ExpenseListItemProps) {
  const { t, i18n } = useLingui();
  const isForeign = expense.currency !== organizationCurrency;

  return (
    <div className="flex items-center gap-3 rounded-xs p-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{expense.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          <Trans>Paid by {payerName}</Trans> · {dayjs(expense.paidOn).format("LL")}
          {eventTitle ? ` · ${eventTitle}` : ""}
        </span>
      </div>
      <div className="text-right text-sm tabular-nums">
        <div>{formatMoney(expense.amountMinor, expense.currency, i18n.locale)}</div>
        {isForeign && (
          <div className="text-xs text-muted-foreground">
            ≈ {formatMoney(expense.convertedAmountMinor, organizationCurrency, i18n.locale)}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t`Expense actions`} />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>{t`Update`}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            {t`Delete`}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
