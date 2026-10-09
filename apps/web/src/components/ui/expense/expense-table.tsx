import "@/lib/dayjs";
import dayjs from "dayjs";
import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, MoreVertical, Receipt } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import { Blobatar } from "@/components/ui/blobatar";
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
import { DateTile } from "@/components/ui/expense/date-tile";
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

export interface ExpenseMonth {
  key: string;
  totalMinor: number;
  expenses: Expense[];
}

export function groupByMonth(expenses: Expense[]): ExpenseMonth[] {
  const months: Record<string, ExpenseMonth> = {};

  expenses.forEach((expense) => {
    const monthKey = expense.paidOn.slice(0, 7);

    if (!months[monthKey]) {
      months[monthKey] = {
        key: monthKey,
        totalMinor: 0,
        expenses: [],
      };
    }

    months[monthKey].totalMinor += expense.convertedAmountMinor;
    months[monthKey].expenses.push(expense);
  });

  return Object.values(months).sort((a, b) => b.key.localeCompare(a.key));
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
    <div className="overflow-hidden rounded-lg border">
      <Table className="m-0">
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead>{t`Date`}</TableHead>
            <TableHead>{t`Title`}</TableHead>
            <TableHead>{t`Event`}</TableHead>
            <TableHead>{t`Paid by`}</TableHead>
            <TableHead>{t`Amount`}</TableHead>
            <TableHead>{t`Actions`}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupByMonth(expenses).map((month) => (
            <Fragment key={month.key}>
              <TableRow className="bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase hover:bg-muted/50">
                <TableCell colSpan={4}>{dayjs(month.key).format("MMMM YYYY")}</TableCell>
                <TableCell colSpan={2} className="text-right tabular-nums">
                  {formatMoney(month.totalMinor, organizationCurrency, i18n.locale)}
                </TableCell>
              </TableRow>
              {month.expenses.map((expense) => {
                const event = events.find((candidate) => candidate.id === expense.eventId);
                const payer =
                  participants.find((participant) => participant.userId === expense.payerId)
                    ?.name ?? expense.payerId;

                return (
                  <TableRow key={expense.id}>
                    <TableCell className="w-14">
                      <DateTile date={expense.paidOn} />
                    </TableCell>
                    <TableCell className="max-w-72">
                      <div className="font-semibold">{expense.title}</div>
                      {expense.description && (
                        <div className="truncate text-muted-foreground">{expense.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-52">
                      {event && (
                        <Link
                          to="/projects/$projectSlug/calendar/$eventId"
                          params={{ projectSlug, eventId: event.id }}
                          target="_blank"
                          title={dayjs(event.startDate).format("LLL")}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground no-underline hover:underline"
                        >
                          <CalendarDays className="size-3 shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Blobatar name={payer} className="size-6" />
                        {payer}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-semibold">
                        {formatMoney(expense.amountMinor, expense.currency, i18n.locale)}
                      </div>
                      {expense.currency !== organizationCurrency && (
                        <div className="text-xs text-muted-foreground">
                          ≈{" "}
                          {formatMoney(
                            expense.convertedAmountMinor,
                            organizationCurrency,
                            i18n.locale,
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-10">
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
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
