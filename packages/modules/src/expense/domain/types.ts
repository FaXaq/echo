export const DEFAULT_CURRENCY = "EUR";

export type SplitMode = "equal" | "exact";

export type SplitInput =
  | { mode: "equal"; userIds: string[] }
  | { mode: "exact"; shares: { userId: string; amountMinor: number }[] };

export type Share = {
  userId: string;
  amountMinor: number;
  convertedAmountMinor: number;
};

export type ExpenseFields = {
  title: string;
  description: string | null;
  paidOn: string;
  amountMinor: number;
  currency: string;
  exchangeRate: string | null;
  convertedAmountMinor: number;
  splitMode: SplitMode;
  payerId: string;
  eventId: string | null;
  shares: Share[];
};

export type Expense = ExpenseFields & {
  id: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
};

export type RepaymentFields = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  paidOn: string;
  note: string | null;
};

export type Repayment = RepaymentFields & {
  id: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
};

export type Balance = { userId: string; amountMinor: number };

export type SuggestedRepayment = {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
};

export type LedgerParticipant = {
  userId: string;
  name: string;
  image: string | null;
  isMember: boolean;
};
