import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import {
  RepaymentDialog,
  type RepaymentDialogState,
} from "@/components/ui/expense/repayment-dialog";
import { toast } from "@/components/ui/toast";
import {
  getLedgerSummaryQueryOptions,
  useCreateRepaymentMutation,
  useUpdateRepaymentMutation,
} from "@/services/resources/expense";

export interface SuspendedRepaymentDialogProps {
  organizationId: string;
  currentUserId: string;
  state: RepaymentDialogState;
  onClose: () => void;
}

function RepaymentDialogContent({
  organizationId,
  currentUserId,
  state,
  onClose,
}: SuspendedRepaymentDialogProps) {
  const { t } = useLingui();
  const { data: summary } = useSuspenseQuery(getLedgerSummaryQueryOptions({ organizationId }));
  const createRepayment = useCreateRepaymentMutation({ organizationId });
  const updateRepayment = useUpdateRepaymentMutation({ organizationId });

  return (
    <RepaymentDialog
      state={state}
      participants={summary.participants}
      organizationCurrency={summary.currency}
      currentUserId={currentUserId}
      onOpenChange={(open) => !open && onClose()}
      onSubmit={async (submission) => {
        try {
          if (state?.mode === "edit") {
            await updateRepayment.mutateAsync({ id: state.repayment.id, ...submission });
          } else {
            await createRepayment.mutateAsync(submission);
          }
          onClose();
        } catch {
          toast.add({ type: "error", title: t`Couldn't save repayment` });
        }
      }}
    />
  );
}

export function SuspendedRepaymentDialog(props: SuspendedRepaymentDialogProps) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <RepaymentDialogContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
