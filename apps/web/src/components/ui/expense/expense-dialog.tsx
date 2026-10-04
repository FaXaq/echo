import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildExpenseSubmission,
  emptyExpenseFormValues,
  expenseToFormValues,
  previewConvertedAmount,
  type ExpenseFormError,
  type ExpenseFormValues,
  type ExpenseSubmission,
} from "@/lib/expense-form";
import { formatMoney } from "@/lib/money";
import type { Expense } from "@/services/resources/expense";

export type ExpenseDialogState = { mode: "create" } | { mode: "edit"; expense: Expense } | null;

export interface ExpenseDialogParticipant {
  userId: string;
  name: string;
  isMember: boolean;
}

export interface ExpenseDialogEvent {
  id: string;
  title: string;
}

export interface ExpenseDialogProps {
  state: ExpenseDialogState;
  participants: ExpenseDialogParticipant[];
  events: ExpenseDialogEvent[];
  organizationCurrency: string;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: ExpenseSubmission) => void | Promise<void>;
}

function getDefaults(
  state: ExpenseDialogState,
  context: {
    participants: ExpenseDialogParticipant[];
    organizationCurrency: string;
    currentUserId: string;
  },
): ExpenseFormValues {
  if (state?.mode === "edit") return expenseToFormValues(state.expense);
  return emptyExpenseFormValues({
    organizationCurrency: context.organizationCurrency,
    currentUserId: context.currentUserId,
    memberIds: context.participants.filter((p) => p.isMember).map((p) => p.userId),
    today: dayjs().format("YYYY-MM-DD"),
  });
}

export function ExpenseDialog({
  state,
  participants,
  events,
  organizationCurrency,
  currentUserId,
  onOpenChange,
  onSubmit,
}: ExpenseDialogProps) {
  const { t, i18n } = useLingui();

  const [content, setContent] = useState(state);
  useEffect(() => {
    if (state !== null) setContent(state);
  }, [state]);
  const isEdit = content?.mode === "edit";

  const [error, setError] = useState<ExpenseFormError | null>(null);

  const { register, control, handleSubmit, reset, watch, formState } = useForm<ExpenseFormValues>({
    defaultValues: getDefaults(content, { participants, organizationCurrency, currentUserId }),
  });

  const context = useRef({ participants, organizationCurrency, currentUserId });
  context.current = { participants, organizationCurrency, currentUserId };

  useEffect(() => {
    if (state === null) return;
    reset(getDefaults(state, context.current));
    setError(null);
  }, [state, reset]);

  const values = watch();
  const keptUserIds = new Set(
    content?.mode === "edit"
      ? [content.expense.payerId, ...content.expense.shares.map((share) => share.userId)]
      : [],
  );
  const selectable = participants.filter((p) => p.isMember || keptUserIds.has(p.userId));
  const nameOf = (userId: string) => participants.find((p) => p.userId === userId)?.name ?? userId;
  const currencies = [
    organizationCurrency,
    ...Intl.supportedValuesOf("currency").filter((code) => code !== organizationCurrency),
  ];
  const isForeign = values.currency !== organizationCurrency;
  const converted = previewConvertedAmount(values, organizationCurrency);

  const errorMessages: Record<ExpenseFormError, string> = {
    title: t`Title is required`,
    paidOn: t`Date is required`,
    amount: t`Enter a valid amount`,
    exchangeRate: t`Enter a valid exchange rate`,
    payer: t`Choose who paid`,
    split: t`Choose who shares this expense`,
    splitSum: t`Exact amounts must add up to the total`,
  };
  const errorFor = (field: ExpenseFormError) =>
    error === field ? errorMessages[field] : undefined;

  const submit = async (formValues: ExpenseFormValues) => {
    const result = buildExpenseSubmission(formValues, organizationCurrency);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    await onSubmit(result.value);
  };

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t`Edit expense` : t`New expense`}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t`Edit expense` : t`New expense`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
          <ScrollArea className="-mx-4 min-h-0 px-4">
            <FieldGroup className="pb-4">
              <Field>
                <FieldLabel htmlFor="expense-title">{t`Title`}</FieldLabel>
                <Input id="expense-title" autoFocus {...register("title")} />
                <FieldError>{errorFor("title")}</FieldError>
              </Field>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field>
                  <FieldLabel htmlFor="expense-amount">{t`Amount`}</FieldLabel>
                  <Input id="expense-amount" inputMode="decimal" {...register("amount")} />
                  <FieldError>{errorFor("amount")}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="expense-currency">{t`Currency`}</FieldLabel>
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(next) => field.onChange(next ?? "")}
                      >
                        <SelectTrigger id="expense-currency" className="w-24">
                          <SelectValue>{() => field.value}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              {isForeign && (
                <Field>
                  <FieldLabel htmlFor="expense-rate">{t`Exchange rate`}</FieldLabel>
                  <Input id="expense-rate" inputMode="decimal" {...register("exchangeRate")} />
                  <p className="m-0 text-xs text-muted-foreground">
                    {t`1 ${values.currency} = how many ${organizationCurrency}?`}
                    {converted !== null &&
                      ` ≈ ${formatMoney(converted, organizationCurrency, i18n.locale)}`}
                  </p>
                  <FieldError>{errorFor("exchangeRate")}</FieldError>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="expense-date">{t`Date`}</FieldLabel>
                <Input id="expense-date" type="date" {...register("paidOn")} />
                <FieldError>{errorFor("paidOn")}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="expense-payer">{t`Paid by`}</FieldLabel>
                <Controller
                  name="payerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(next) => field.onChange(next ?? "")}
                    >
                      <SelectTrigger id="expense-payer" className="w-full">
                        <SelectValue>{() => nameOf(field.value)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {selectable.map((participant) => (
                          <SelectItem key={participant.userId} value={participant.userId}>
                            {participant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errorFor("payer")}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="expense-split-mode">{t`Split`}</FieldLabel>
                <Controller
                  name="splitMode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(next) => field.onChange(next === "exact" ? "exact" : "equal")}
                    >
                      <SelectTrigger id="expense-split-mode" className="w-full">
                        <SelectValue>
                          {() => (field.value === "exact" ? t`By exact amounts` : t`Equally`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">{t`Equally`}</SelectItem>
                        <SelectItem value="exact">{t`By exact amounts`}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {values.splitMode === "equal" ? (
                  <Controller
                    name="equalUserIds"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2 pt-1">
                        {selectable.map((participant) => (
                          <label
                            key={participant.userId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={field.value.includes(participant.userId)}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? [...field.value, participant.userId]
                                    : field.value.filter((id) => id !== participant.userId),
                                )
                              }
                            />
                            {participant.name}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                ) : (
                  <Controller
                    name="exactAmounts"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col gap-2 pt-1">
                        {selectable.map((participant) => (
                          <div key={participant.userId} className="flex items-center gap-2">
                            <span className="flex-1 text-sm">{participant.name}</span>
                            <Input
                              aria-label={participant.name}
                              inputMode="decimal"
                              className="w-28"
                              value={field.value[participant.userId] ?? ""}
                              onChange={(event) =>
                                field.onChange({
                                  ...field.value,
                                  [participant.userId]: event.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}
                <FieldError>{errorFor("split") ?? errorFor("splitSum")}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="expense-event">{t`Event`}</FieldLabel>
                <Controller
                  name="eventId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value === "" ? "none" : field.value}
                      onValueChange={(next) => field.onChange(next === "none" ? "" : (next ?? ""))}
                    >
                      <SelectTrigger id="expense-event" className="w-full">
                        <SelectValue>
                          {() =>
                            events.find((event) => event.id === field.value)?.title ?? t`No event`
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t`No event`}</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="expense-description">{t`Description`}</FieldLabel>
                <Textarea id="expense-description" {...register("description")} />
              </Field>
            </FieldGroup>
          </ScrollArea>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={formState.isSubmitting} />}
            >
              {t`Cancel`}
            </DialogClose>
            <Button
              type="submit"
              isLoading={formState.isSubmitting}
              disabled={formState.isSubmitting}
            >
              {isEdit ? t`Save changes` : t`Create expense`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
