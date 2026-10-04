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
import type { Repayment } from "@/services/resources/expense";

export interface RepaymentListItemProps {
  repayment: Repayment;
  fromName: string;
  toName: string;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function RepaymentListItem({
  repayment,
  fromName,
  toName,
  currency,
  onEdit,
  onDelete,
}: RepaymentListItemProps) {
  const { t, i18n } = useLingui();

  return (
    <div className="flex items-center gap-3 rounded-xs p-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          <Trans>
            {fromName} paid {toName}
          </Trans>
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {dayjs(repayment.paidOn).format("LL")}
          {repayment.note ? ` · ${repayment.note}` : ""}
        </span>
      </div>
      <span className="text-sm tabular-nums">
        {formatMoney(repayment.amountMinor, currency, i18n.locale)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t`Repayment actions`}
            />
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
