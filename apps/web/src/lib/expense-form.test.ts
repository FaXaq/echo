import { describe, expect, it } from "vitest";
import {
  buildExpenseSubmission,
  buildRepaymentSubmission,
  emptyExpenseFormValues,
  emptyRepaymentFormValues,
  expenseToFormValues,
  previewConvertedAmount,
  type ExpenseFormValues,
} from "./expense-form";

const base: ExpenseFormValues = {
  title: "Rehearsal",
  description: "",
  paidOn: "2026-10-01",
  amount: "40",
  currency: "EUR",
  exchangeRate: "",
  payerId: "marie",
  eventId: "",
  splitMode: "equal",
  equalUserIds: ["marie", "paul"],
  exactAmounts: {},
};

describe("buildExpenseSubmission", () => {
  it("builds an equal-split submission in minor units", () => {
    expect(buildExpenseSubmission(base, "EUR")).toEqual({
      ok: true,
      value: {
        title: "Rehearsal",
        paidOn: "2026-10-01",
        amountMinor: 4000,
        currency: "EUR",
        payerId: "marie",
        split: { mode: "equal", userIds: ["marie", "paul"] },
      },
    });
  });

  it("rejects a blank title, a missing date and a missing payer", () => {
    expect(buildExpenseSubmission({ ...base, title: "  " }, "EUR")).toEqual({
      ok: false,
      error: "title",
    });
    expect(buildExpenseSubmission({ ...base, paidOn: "" }, "EUR")).toEqual({
      ok: false,
      error: "paidOn",
    });
    expect(buildExpenseSubmission({ ...base, payerId: "" }, "EUR")).toEqual({
      ok: false,
      error: "payer",
    });
  });

  it("understands a decimal comma and rejects more decimals than the currency has", () => {
    const comma = buildExpenseSubmission({ ...base, amount: "12,50" }, "EUR");
    expect(comma.ok && comma.value.amountMinor).toBe(1250);
    expect(buildExpenseSubmission({ ...base, currency: "JPY", amount: "10.5" }, "EUR")).toEqual({
      ok: false,
      error: "amount",
    });
    expect(buildExpenseSubmission({ ...base, amount: "0" }, "EUR")).toEqual({
      ok: false,
      error: "amount",
    });
  });

  it("requires a valid rate for a foreign currency and normalizes a decimal comma", () => {
    const foreign = { ...base, currency: "USD", amount: "50" };
    expect(buildExpenseSubmission(foreign, "EUR")).toEqual({ ok: false, error: "exchangeRate" });
    expect(buildExpenseSubmission({ ...foreign, exchangeRate: "0" }, "EUR")).toEqual({
      ok: false,
      error: "exchangeRate",
    });

    const result = buildExpenseSubmission({ ...foreign, exchangeRate: "0,92" }, "EUR");
    expect(result.ok && result.value).toMatchObject({
      amountMinor: 5000,
      currency: "USD",
      exchangeRate: "0.92",
    });
  });

  it("omits the rate for the organization currency even if one was typed", () => {
    const result = buildExpenseSubmission({ ...base, exchangeRate: "1.5" }, "EUR");
    expect(result.ok && result.value.exchangeRate).toBeUndefined();
  });

  it("builds an exact split, ignoring blank entries", () => {
    const result = buildExpenseSubmission(
      { ...base, splitMode: "exact", exactAmounts: { marie: "25", paul: "15", lea: "" } },
      "EUR",
    );
    expect(result.ok && result.value.split).toEqual({
      mode: "exact",
      shares: [
        { userId: "marie", amountMinor: 2500 },
        { userId: "paul", amountMinor: 1500 },
      ],
    });
  });

  it("rejects an exact split that does not add up, or is empty", () => {
    expect(
      buildExpenseSubmission(
        { ...base, splitMode: "exact", exactAmounts: { marie: "25", paul: "10" } },
        "EUR",
      ),
    ).toEqual({ ok: false, error: "splitSum" });
    expect(
      buildExpenseSubmission({ ...base, splitMode: "exact", exactAmounts: {} }, "EUR"),
    ).toEqual({ ok: false, error: "split" });
    expect(buildExpenseSubmission({ ...base, equalUserIds: [] }, "EUR")).toEqual({
      ok: false,
      error: "split",
    });
  });
});

describe("previewConvertedAmount", () => {
  it("converts with the typed rate", () => {
    expect(
      previewConvertedAmount({ amount: "50", currency: "USD", exchangeRate: "0.92" }, "EUR"),
    ).toBe(4600);
  });

  it("is null for the organization currency or an unusable rate/amount", () => {
    expect(
      previewConvertedAmount({ amount: "50", currency: "EUR", exchangeRate: "" }, "EUR"),
    ).toBeNull();
    expect(
      previewConvertedAmount({ amount: "50", currency: "USD", exchangeRate: "x" }, "EUR"),
    ).toBeNull();
    expect(
      previewConvertedAmount({ amount: "", currency: "USD", exchangeRate: "0.9" }, "EUR"),
    ).toBeNull();
  });
});

describe("form defaults", () => {
  it("defaults a new expense to the current user as payer and every member as a share holder", () => {
    expect(
      emptyExpenseFormValues({
        organizationCurrency: "EUR",
        currentUserId: "marie",
        memberIds: ["marie"],
        today: "2026-10-04",
      }),
    ).toMatchObject({
      paidOn: "2026-10-04",
      currency: "EUR",
      payerId: "marie",
      equalUserIds: ["marie"],
      splitMode: "equal",
    });
  });

  it("round-trips an existing exact-split foreign expense into editable strings", () => {
    expect(
      expenseToFormValues({
        title: "Merch",
        description: null,
        paidOn: "2026-10-02",
        amountMinor: 5000,
        currency: "USD",
        exchangeRate: "0.92",
        payerId: "paul",
        eventId: "event-1",
        splitMode: "exact",
        shares: [
          { userId: "marie", amountMinor: 3333 },
          { userId: "paul", amountMinor: 1667 },
        ],
      }),
    ).toEqual({
      title: "Merch",
      description: "",
      paidOn: "2026-10-02",
      amount: "50.00",
      currency: "USD",
      exchangeRate: "0.92",
      payerId: "paul",
      eventId: "event-1",
      splitMode: "exact",
      equalUserIds: ["marie", "paul"],
      exactAmounts: { marie: "33.33", paul: "16.67" },
    });
  });
});

describe("buildRepaymentSubmission", () => {
  const values = {
    fromUserId: "paul",
    toUserId: "marie",
    amount: "20",
    paidOn: "2026-10-05",
    note: "",
  };

  it("builds a submission in the organization currency's minor units", () => {
    expect(buildRepaymentSubmission(values, "EUR")).toEqual({
      ok: true,
      value: { fromUserId: "paul", toUserId: "marie", amountMinor: 2000, paidOn: "2026-10-05" },
    });
  });

  it("rejects missing or identical people and a bad amount", () => {
    expect(buildRepaymentSubmission({ ...values, fromUserId: "" }, "EUR")).toEqual({
      ok: false,
      error: "from",
    });
    expect(buildRepaymentSubmission({ ...values, toUserId: "" }, "EUR")).toEqual({
      ok: false,
      error: "to",
    });
    expect(buildRepaymentSubmission({ ...values, toUserId: "paul" }, "EUR")).toEqual({
      ok: false,
      error: "same",
    });
    expect(buildRepaymentSubmission({ ...values, amount: "0" }, "EUR")).toEqual({
      ok: false,
      error: "amount",
    });
  });

  it("pre-fills a suggested repayment", () => {
    expect(
      emptyRepaymentFormValues({
        organizationCurrency: "EUR",
        currentUserId: "marie",
        today: "2026-10-05",
        suggestion: { fromUserId: "paul", toUserId: "marie", amountMinor: 2000 },
      }),
    ).toEqual({
      fromUserId: "paul",
      toUserId: "marie",
      amount: "20.00",
      paidOn: "2026-10-05",
      note: "",
    });
  });
});
