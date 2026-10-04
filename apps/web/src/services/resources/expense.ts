import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("expense");

export { key };

export type Expense = RouterOutputs["expense"]["list"][number];
export type Repayment = RouterOutputs["expense"]["repayment"]["list"][number];
export type LedgerSummary = RouterOutputs["expense"]["summary"];
export type LedgerSettings = RouterOutputs["expense"]["settings"];
export type ExpenseInput = Omit<RouterInputs["expense"]["create"], "organizationId">;
export type RepaymentInput = Omit<RouterInputs["expense"]["repayment"]["create"], "organizationId">;

export function getExpensesQueryOptions(opts: { organizationId: string; eventId?: string }) {
  return queryOptions({
    queryKey: getResourceKey("list", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.expense.list.query(params, { signal });
    },
  });
}

export function getLedgerSummaryQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("summary", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.expense.summary.query(params, { signal });
    },
  });
}

export function getLedgerSettingsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("settings", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.expense.settings.query(params, { signal });
    },
  });
}

export function getRepaymentsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listRepayments", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.expense.repayment.list.query(params, { signal });
    },
  });
}

export function useCreateExpenseMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseInput) =>
      apiClient.expense.create.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateExpenseMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseInput & { id: string }) =>
      apiClient.expense.update.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteExpenseMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.expense.delete.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCreateRepaymentMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RepaymentInput) =>
      apiClient.expense.repayment.create.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateRepaymentMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RepaymentInput & { id: string }) =>
      apiClient.expense.repayment.update.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteRepaymentMutation({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.expense.repayment.delete.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
