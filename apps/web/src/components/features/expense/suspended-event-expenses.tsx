import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import {
  getExpensesQueryOptions,
  getLedgerSettingsQueryOptions,
} from "@/services/resources/expense";

export interface SuspendedEventExpensesProps {
  organizationId: string;
  eventId: string;
}

function EventExpensesContent({ organizationId, eventId }: SuspendedEventExpensesProps) {
  const { t, i18n } = useLingui();
  const { data: expenses } = useSuspenseQuery(getExpensesQueryOptions({ organizationId, eventId }));
  const { data: settings } = useSuspenseQuery(getLedgerSettingsQueryOptions({ organizationId }));
  const total = expenses.reduce((sum, expense) => sum + expense.convertedAmountMinor, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{t`Expenses`}</span>
        {expenses.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {t`Total`} {formatMoney(total, settings.currency, i18n.locale)}
          </span>
        )}
      </div>
      {expenses.length === 0 ? (
        <p className="m-0 text-xs text-muted-foreground">{t`No expenses linked to this event.`}</p>
      ) : (
        <ul className="m-0 flex flex-col gap-1 p-0">
          {expenses.map((expense) => (
            <li key={expense.id} className="m-0 flex list-none items-center gap-2 p-0 text-sm">
              <span className="truncate">{expense.title}</span>
              <span className="ml-auto tabular-nums">
                {formatMoney(expense.amountMinor, expense.currency, i18n.locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventExpensesError() {
  const { t } = useLingui();
  return <p className="text-xs text-destructive">{t`Couldn't load expenses`}</p>;
}

export function SuspendedEventExpenses(props: SuspendedEventExpensesProps) {
  return (
    <ErrorBoundary FallbackComponent={EventExpensesError}>
      <Suspense fallback={<Skeleton className="h-12 w-full" />}>
        <EventExpensesContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
