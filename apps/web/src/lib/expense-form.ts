import {
  convertAmount,
  currencyExponent,
  formatMajorAmount,
  parseMajorAmount,
  type SplitInput,
} from "@echo/modules/expense/domain";

type Result<Value, Error> = { ok: true; value: Value } | { ok: false; error: Error };

const RATE_PATTERN = /^\d+(\.\d{1,8})?$/;
const normalizeRate = (rate: string) => rate.trim().replace(",", ".");
const isValidRate = (rate: string) => RATE_PATTERN.test(rate) && Number(rate) > 0;

export type ExpenseFormValues = {
  title: string;
  description: string;
  paidOn: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  payerId: string;
  eventId: string;
  splitMode: "equal" | "exact";
  equalUserIds: string[];
  exactAmounts: Record<string, string>;
};

export type ExpenseSubmission = {
  title: string;
  description?: string;
  paidOn: string;
  amountMinor: number;
  currency: string;
  exchangeRate?: string;
  payerId: string;
  eventId?: string;
  split: SplitInput;
};

export type ExpenseFormError =
  | "title"
  | "paidOn"
  | "amount"
  | "exchangeRate"
  | "payer"
  | "split"
  | "splitSum";

export function emptyExpenseFormValues(input: {
  organizationCurrency: string;
  currentUserId: string;
  memberIds: string[];
  today: string;
}): ExpenseFormValues {
  return {
    title: "",
    description: "",
    paidOn: input.today,
    amount: "",
    currency: input.organizationCurrency,
    exchangeRate: "",
    payerId: input.currentUserId,
    eventId: "",
    splitMode: "equal",
    equalUserIds: input.memberIds,
    exactAmounts: {},
  };
}

export function expenseToFormValues(expense: {
  title: string;
  description: string | null;
  paidOn: string;
  amountMinor: number;
  currency: string;
  exchangeRate: string | null;
  payerId: string;
  eventId: string | null;
  splitMode: "equal" | "exact";
  shares: { userId: string; amountMinor: number }[];
}): ExpenseFormValues {
  const exponent = currencyExponent(expense.currency);
  return {
    title: expense.title,
    description: expense.description ?? "",
    paidOn: expense.paidOn,
    amount: formatMajorAmount(expense.amountMinor, exponent),
    currency: expense.currency,
    exchangeRate: expense.exchangeRate ?? "",
    payerId: expense.payerId,
    eventId: expense.eventId ?? "",
    splitMode: expense.splitMode,
    equalUserIds: expense.shares.map((share) => share.userId),
    exactAmounts: Object.fromEntries(
      expense.shares.map((share) => [share.userId, formatMajorAmount(share.amountMinor, exponent)]),
    ),
  };
}

export function buildExpenseSubmission(
  values: ExpenseFormValues,
  organizationCurrency: string,
): Result<ExpenseSubmission, ExpenseFormError> {
  const title = values.title.trim();
  if (title === "") return { ok: false, error: "title" };
  if (values.paidOn === "") return { ok: false, error: "paidOn" };

  const exponent = currencyExponent(values.currency);
  const amountMinor = parseMajorAmount(values.amount, exponent);
  if (amountMinor === null || amountMinor <= 0) return { ok: false, error: "amount" };

  let exchangeRate: string | undefined;
  if (values.currency !== organizationCurrency) {
    const rate = normalizeRate(values.exchangeRate);
    if (!isValidRate(rate)) return { ok: false, error: "exchangeRate" };
    exchangeRate = rate;
  }

  if (values.payerId === "") return { ok: false, error: "payer" };

  let split: SplitInput;
  if (values.splitMode === "equal") {
    if (values.equalUserIds.length === 0) return { ok: false, error: "split" };
    split = { mode: "equal", userIds: values.equalUserIds };
  } else {
    const shares: { userId: string; amountMinor: number }[] = [];
    for (const [userId, amount] of Object.entries(values.exactAmounts)) {
      if (amount.trim() === "") continue;
      const shareMinor = parseMajorAmount(amount, exponent);
      if (shareMinor === null || shareMinor <= 0) return { ok: false, error: "split" };
      shares.push({ userId, amountMinor: shareMinor });
    }
    if (shares.length === 0) return { ok: false, error: "split" };
    if (shares.reduce((sum, share) => sum + share.amountMinor, 0) !== amountMinor) {
      return { ok: false, error: "splitSum" };
    }
    split = { mode: "exact", shares };
  }

  return {
    ok: true,
    value: {
      title,
      description: values.description.trim() || undefined,
      paidOn: values.paidOn,
      amountMinor,
      currency: values.currency,
      exchangeRate,
      payerId: values.payerId,
      eventId: values.eventId || undefined,
      split,
    },
  };
}

export function previewConvertedAmount(
  values: Pick<ExpenseFormValues, "amount" | "currency" | "exchangeRate">,
  organizationCurrency: string,
) {
  if (values.currency === organizationCurrency) return null;

  const fromExponent = currencyExponent(values.currency);
  const amountMinor = parseMajorAmount(values.amount, fromExponent);
  const rate = normalizeRate(values.exchangeRate);
  if (amountMinor === null || !isValidRate(rate)) return null;

  return convertAmount({
    amountMinor,
    fromExponent,
    toExponent: currencyExponent(organizationCurrency),
    rate,
  });
}

export type RepaymentFormValues = {
  fromUserId: string;
  toUserId: string;
  amount: string;
  paidOn: string;
  note: string;
};

export type RepaymentSubmission = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  paidOn: string;
  note?: string;
};

export type RepaymentFormError = "from" | "to" | "same" | "amount" | "paidOn";

export function emptyRepaymentFormValues(input: {
  organizationCurrency: string;
  currentUserId: string;
  today: string;
  suggestion?: { fromUserId: string; toUserId: string; amountMinor: number };
}): RepaymentFormValues {
  const { suggestion } = input;
  return {
    fromUserId: suggestion?.fromUserId ?? input.currentUserId,
    toUserId: suggestion?.toUserId ?? "",
    amount: suggestion
      ? formatMajorAmount(suggestion.amountMinor, currencyExponent(input.organizationCurrency))
      : "",
    paidOn: input.today,
    note: "",
  };
}

export function repaymentToFormValues(
  repayment: {
    fromUserId: string;
    toUserId: string;
    amountMinor: number;
    paidOn: string;
    note: string | null;
  },
  organizationCurrency: string,
): RepaymentFormValues {
  return {
    fromUserId: repayment.fromUserId,
    toUserId: repayment.toUserId,
    amount: formatMajorAmount(repayment.amountMinor, currencyExponent(organizationCurrency)),
    paidOn: repayment.paidOn,
    note: repayment.note ?? "",
  };
}

export function buildRepaymentSubmission(
  values: RepaymentFormValues,
  organizationCurrency: string,
): Result<RepaymentSubmission, RepaymentFormError> {
  if (values.fromUserId === "") return { ok: false, error: "from" };
  if (values.toUserId === "") return { ok: false, error: "to" };
  if (values.fromUserId === values.toUserId) return { ok: false, error: "same" };

  const amountMinor = parseMajorAmount(values.amount, currencyExponent(organizationCurrency));
  if (amountMinor === null || amountMinor <= 0) return { ok: false, error: "amount" };
  if (values.paidOn === "") return { ok: false, error: "paidOn" };

  return {
    ok: true,
    value: {
      fromUserId: values.fromUserId,
      toUserId: values.toUserId,
      amountMinor,
      paidOn: values.paidOn,
      note: values.note.trim() || undefined,
    },
  };
}
