import { createFileRoute } from "@tanstack/react-router";
import { SuspendedExpenseLedger } from "@/components/features/expense/suspended-expense-ledger";

export const Route = createFileRoute("/projects/$projectSlug/expenses/")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { organizationId, session } = Route.useRouteContext();

  return <SuspendedExpenseLedger organizationId={organizationId} currentUserId={session.user.id} />;
}
