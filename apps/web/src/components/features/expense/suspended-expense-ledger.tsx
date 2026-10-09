import { useState, type ReactNode } from "react";
import { useLingui } from "@lingui/react/macro";
import { HandCoins, Plus } from "lucide-react";
import type { ExpenseDialogState } from "@/components/ui/expense/expense-dialog";
import type { RepaymentDialogState } from "@/components/ui/expense/repayment-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useDeleteExpenseMutation, useDeleteRepaymentMutation } from "@/services/resources/expense";
import { SuspendedBalances } from "./suspended-balances";
import { SuspendedExpenseDialog } from "./suspended-expense-dialog";
import { SuspendedExpenseTable } from "./suspended-expense-table";
import { SuspendedLedgerStats } from "./suspended-ledger-stats";
import { SuspendedRepaymentDialog } from "./suspended-repayment-dialog";
import { SuspendedRepaymentTable } from "./suspended-repayment-table";
import { SuspendedSuggestedRepayments } from "./suspended-suggested-repayments";

export interface SuspendedExpenseLedgerProps {
  organizationId: string;
  currentUserId: string;
}

function HeaderButton({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  variant?: "outline";
  onClick: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant={variant}
        aria-label={label}
        onClick={onClick}
        className="lg:hidden"
      >
        {icon}
      </Button>
      <Button type="button" variant={variant} onClick={onClick} className="hidden lg:inline-flex">
        {icon}
        {label}
      </Button>
    </>
  );
}

type PendingDelete = { kind: "expense" | "repayment"; id: string } | null;

export function SuspendedExpenseLedger({
  organizationId,
  currentUserId,
}: SuspendedExpenseLedgerProps) {
  const { t } = useLingui();
  const [expenseDialog, setExpenseDialog] = useState<ExpenseDialogState>(null);
  const [repaymentDialog, setRepaymentDialog] = useState<RepaymentDialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const deleteExpense = useDeleteExpenseMutation({ organizationId });
  const deleteRepayment = useDeleteRepaymentMutation({ organizationId });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="m-0 font-heading text-2xl font-semibold tracking-tight">{t`Expenses`}</h1>
        <div className="flex gap-2">
          <HeaderButton
            label={t`Record repayment`}
            icon={<HandCoins data-icon="inline-start" />}
            variant="outline"
            onClick={() => setRepaymentDialog({ mode: "create" })}
          />
          <HeaderButton
            label={t`New expense`}
            icon={<Plus data-icon="inline-start" />}
            onClick={() => setExpenseDialog({ mode: "create" })}
          />
        </div>
      </header>

      <SuspendedLedgerStats organizationId={organizationId} currentUserId={currentUserId} />

      <div className="flex flex-wrap items-start gap-6">
        <Tabs defaultValue="expenses" className="min-w-0 flex-[999_1_560px]">
          <TabsList>
            <TabsTrigger value="expenses">{t`Expenses`}</TabsTrigger>
            <TabsTrigger value="repayments">{t`Repayments`}</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses">
            <SuspendedExpenseTable
              organizationId={organizationId}
              onEdit={(expense) => setExpenseDialog({ mode: "edit", expense })}
              onDelete={(expense) => setPendingDelete({ kind: "expense", id: expense.id })}
            />
          </TabsContent>
          <TabsContent value="repayments">
            <SuspendedRepaymentTable
              organizationId={organizationId}
              onEdit={(repayment) => setRepaymentDialog({ mode: "edit", repayment })}
              onDelete={(repayment) => setPendingDelete({ kind: "repayment", id: repayment.id })}
            />
          </TabsContent>
        </Tabs>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="m-0 text-base font-semibold">{t`Balances`}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SuspendedBalances organizationId={organizationId} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="m-0 text-base font-semibold">{t`Settle up`}</h2>
              </CardTitle>
              <CardDescription>{t`The fewest transfers to clear every balance.`}</CardDescription>
            </CardHeader>
            <CardContent>
              <SuspendedSuggestedRepayments
                organizationId={organizationId}
                onRecord={(entry) =>
                  setRepaymentDialog({
                    mode: "create",
                    suggestion: {
                      fromUserId: entry.fromUserId,
                      toUserId: entry.toUserId,
                      amountMinor: entry.amountMinor,
                    },
                  })
                }
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <SuspendedExpenseDialog
        organizationId={organizationId}
        currentUserId={currentUserId}
        state={expenseDialog}
        onClose={() => setExpenseDialog(null)}
      />

      <SuspendedRepaymentDialog
        organizationId={organizationId}
        currentUserId={currentUserId}
        state={repaymentDialog}
        onClose={() => setRepaymentDialog(null)}
      />

      <ConfirmDialog
        open={pendingDelete?.kind === "expense"}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t`Delete expense?`}
        description={t`This will permanently delete this expense and change everyone's balance. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        variant="destructive"
        onConfirm={async () => {
          if (pendingDelete?.kind !== "expense") return;
          try {
            await deleteExpense.mutateAsync({ id: pendingDelete.id });
          } catch {
            toast.add({ type: "error", title: t`Couldn't delete expense` });
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete?.kind === "repayment"}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t`Delete repayment?`}
        description={t`This will permanently delete this repayment and change the balances. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        variant="destructive"
        onConfirm={async () => {
          if (pendingDelete?.kind !== "repayment") return;
          try {
            await deleteRepayment.mutateAsync({ id: pendingDelete.id });
          } catch {
            toast.add({ type: "error", title: t`Couldn't delete repayment` });
          }
        }}
      />
    </div>
  );
}
