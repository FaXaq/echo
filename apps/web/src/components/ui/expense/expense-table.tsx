import "@/lib/dayjs";
import dayjs from "dayjs";
import { Link } from "@tanstack/react-router";
import { MoreVertical, Receipt, SquareArrowOutUpRight } from "lucide-react";
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
import type { CalendarEvent } from "@/services/resources/calendar";
import type { Expense, LedgerSummary } from "@/services/resources/expense";

export interface ExpenseTableProps {
  expenses: Expense[];
  events: Pick<CalendarEvent, "id" | "title" | "startDate">[];
  participants: Pick<LedgerSummary["participants"][number], "userId" | "name">[];
  organizationCurrency: string;
  projectSlug: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTable({
  expenses,
  events,
  participants,
  organizationCurrency,
  projectSlug,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  const { t, i18n } = useLingui();

  if (expenses.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>{t`No expenses yet`}</EmptyTitle>
          <EmptyDescription>{t`Expenses you add will show up here.`}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="m-0">
        <TableHeader>
          <TableRow>
            <TableHead>{t`Title`}</TableHead>
            <TableHead>{t`Description`}</TableHead>
            <TableHead>{t`Date`}</TableHead>
            <TableHead>{t`Event`}</TableHead>
            <TableHead>{t`Paid by`}</TableHead>
            <TableHead className="text-right">{t`Amount`}</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">{t`Actions`}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const event = events.find((candidate) => candidate.id === expense.eventId);
            const isForeign = expense.currency !== organizationCurrency;

            return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">
                  {expense.description}
                </TableCell>
                <TableCell>{dayjs(expense.paidOn).format("LL")}</TableCell>
                <TableCell>
                  {event && (
                    <Link
                      to="/projects/$projectSlug/calendar/$eventId"
                      params={{ projectSlug, eventId: event.id }}
                      target="_blank"
                      className="flex items-center gap-2 no-underline hover:underline"
                    >
                      <div className="flex flex-col">
                        <span>{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(event.startDate).format("LLL")}
                        </span>
                      </div>
                      <SquareArrowOutUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {participants.find((participant) => participant.userId === expense.payerId)
                    ?.name ?? expense.payerId}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <div>{formatMoney(expense.amountMinor, expense.currency, i18n.locale)}</div>
                  {isForeign && (
                    <div className="text-xs text-muted-foreground">
                      ≈{" "}
                      {formatMoney(expense.convertedAmountMinor, organizationCurrency, i18n.locale)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t`Expense actions`}
                        />
                      }
                    >
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEdit(expense)}
                      >{t`Update`}</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(expense)}>
                        {t`Delete`}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
