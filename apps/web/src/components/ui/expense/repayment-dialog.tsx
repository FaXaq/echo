import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildRepaymentSubmission,
  emptyRepaymentFormValues,
  repaymentToFormValues,
  type RepaymentFormError,
  type RepaymentFormValues,
  type RepaymentSubmission,
} from "@/lib/expense-form";
import type { Repayment } from "@/services/resources/expense";
import type { ExpenseDialogParticipant } from "./expense-dialog";

export type RepaymentDialogState =
  | {
      mode: "create";
      suggestion?: { fromUserId: string; toUserId: string; amountMinor: number };
    }
  | { mode: "edit"; repayment: Repayment }
  | null;

export interface RepaymentDialogProps {
  state: RepaymentDialogState;
  participants: ExpenseDialogParticipant[];
  organizationCurrency: string;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: RepaymentSubmission) => void | Promise<void>;
}

function getDefaults(
  state: RepaymentDialogState,
  context: { organizationCurrency: string; currentUserId: string },
): RepaymentFormValues {
  if (state?.mode === "edit") {
    return repaymentToFormValues(state.repayment, context.organizationCurrency);
  }
  return emptyRepaymentFormValues({
    organizationCurrency: context.organizationCurrency,
    currentUserId: context.currentUserId,
    today: dayjs().format("YYYY-MM-DD"),
    suggestion: state?.suggestion,
  });
}

export function RepaymentDialog({
  state,
  participants,
  organizationCurrency,
  currentUserId,
  onOpenChange,
  onSubmit,
}: RepaymentDialogProps) {
  const { t } = useLingui();

  const [content, setContent] = useState(state);
  useEffect(() => {
    if (state !== null) setContent(state);
  }, [state]);
  const isEdit = content?.mode === "edit";

  const [error, setError] = useState<RepaymentFormError | null>(null);

  const { register, control, handleSubmit, reset, formState } = useForm<RepaymentFormValues>({
    defaultValues: getDefaults(content, { organizationCurrency, currentUserId }),
  });

  useEffect(() => {
    if (state === null) return;
    reset(getDefaults(state, { organizationCurrency, currentUserId }));
    setError(null);
  }, [state, reset, organizationCurrency, currentUserId]);

  const nameOf = (userId: string) => participants.find((p) => p.userId === userId)?.name ?? userId;

  const errorMessages: Record<RepaymentFormError, string> = {
    from: t`Choose who is paying`,
    to: t`Choose who is being paid back`,
    same: t`Choose two different people`,
    amount: t`Enter a valid amount`,
    paidOn: t`Date is required`,
  };
  const errorFor = (...fields: RepaymentFormError[]) =>
    error !== null && fields.includes(error) ? errorMessages[error] : undefined;

  const submit = async (formValues: RepaymentFormValues) => {
    const result = buildRepaymentSubmission(formValues, organizationCurrency);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    await onSubmit(result.value);
  };

  const personSelect = (name: "fromUserId" | "toUserId", id: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select value={field.value} onValueChange={(next) => field.onChange(next ?? "")}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue>{() => (field.value === "" ? "" : nameOf(field.value))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {participants.map((participant) => (
              <SelectItem key={participant.userId} value={participant.userId}>
                {participant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t`Edit repayment` : t`New repayment`}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t`Edit repayment` : t`New repayment`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="repayment-from">{t`From`}</FieldLabel>
              {personSelect("fromUserId", "repayment-from")}
              <FieldError>{errorFor("from", "same")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="repayment-to">{t`To`}</FieldLabel>
              {personSelect("toUserId", "repayment-to")}
              <FieldError>{errorFor("to")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="repayment-amount">{`${t`Amount`} (${organizationCurrency})`}</FieldLabel>
              <Input id="repayment-amount" inputMode="decimal" {...register("amount")} />
              <FieldError>{errorFor("amount")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="repayment-date">{t`Date`}</FieldLabel>
              <Input id="repayment-date" type="date" {...register("paidOn")} />
              <FieldError>{errorFor("paidOn")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="repayment-note">{t`Note`}</FieldLabel>
              <Input id="repayment-note" {...register("note")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={formState.isSubmitting} />}
            >
              {t`Cancel`}
            </DialogClose>
            <Button type="submit" isLoading={formState.isSubmitting}>
              {isEdit ? t`Save changes` : t`Create repayment`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
