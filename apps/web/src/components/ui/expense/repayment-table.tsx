import "@/lib/dayjs";
import dayjs from "dayjs";
import { HandCoins, MoreVertical } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import type { LedgerSummary, Repayment } from "@/services/resources/expense";

export interface RepaymentTableProps {
  repayments: Repayment[];
  participants: Pick<LedgerSummary["participants"][number], "userId" | "name">[];
  currency: string;
  onEdit: (repayment: Repayment) => void;
  onDelete: (repayment: Repayment) => void;
}

export function RepaymentTable({
  repayments,
  participants,
  currency,
  onEdit,
  onDelete,
}: RepaymentTableProps) {
  const { t, i18n } = useLingui();
  const nameOf = (userId: string) =>
    participants.find((participant) => participant.userId === userId)?.name ?? userId;

  if (repayments.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HandCoins />
          </EmptyMedia>
          <EmptyTitle>{t`No repayments yet`}</EmptyTitle>
          <EmptyDescription>{t`Repayments you record will show up here.`}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="m-0">
        <TableHeader>
          <TableRow>
            <TableHead>{t`From`}</TableHead>
            <TableHead>{t`To`}</TableHead>
            <TableHead>{t`Date`}</TableHead>
            <TableHead>{t`Note`}</TableHead>
            <TableHead className="text-right">{t`Amount`}</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">{t`Actions`}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repayments.map((repayment) => (
            <TableRow key={repayment.id}>
              <TableCell className="font-medium">{nameOf(repayment.fromUserId)}</TableCell>
              <TableCell className="font-medium">{nameOf(repayment.toUserId)}</TableCell>
              <TableCell>{dayjs(repayment.paidOn).format("LL")}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">
                {repayment.note}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(repayment.amountMinor, currency, i18n.locale)}
              </TableCell>
              <TableCell>
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
                    <DropdownMenuItem
                      onClick={() => onEdit(repayment)}
                    >{t`Update`}</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(repayment)}>
                      {t`Delete`}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
