import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("outreach");

export { key };

export type OutreachColumn = RouterOutputs["outreach"]["listColumns"][number];
export type OutreachCard = RouterOutputs["outreach"]["listCards"][number];
export type OutreachCardContact = RouterOutputs["outreach"]["listCardContacts"][number];
export type OutreachPlace = NonNullable<OutreachCard["place"]>;

export function listOutreachColumnsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listColumns", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.outreach.listColumns.query(params, { signal });
    },
  });
}

export function listOutreachCardsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listCards", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.outreach.listCards.query(params, { signal });
    },
  });
}

export function listOutreachCardContactsQueryOptions(opts: {
  organizationId: string;
  cardId: string;
}) {
  return queryOptions({
    queryKey: getResourceKey("listCardContacts", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.outreach.listCardContacts.query(params, { signal });
    },
  });
}

export function useCreateOutreachColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; name: string }) =>
      apiClient.outreach.createColumn.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useRenameOutreachColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; id: string; name: string }) =>
      apiClient.outreach.renameColumn.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useReorderOutreachColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organizationId: string;
      id: string;
      beforeId: string | null;
      afterId: string | null;
    }) => apiClient.outreach.reorderColumn.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteOutreachColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; id: string }) =>
      apiClient.outreach.deleteColumn.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

interface OutreachCardFields {
  organizationId: string;
  title: string;
  place?: OutreachPlace | null;
  description?: string;
  assigneeId?: string | null;
}

export type OutreachCardCreateInput = OutreachCardFields & { columnId: string };
export type OutreachCardUpdateInput = OutreachCardFields & { id: string };

export function useCreateOutreachCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OutreachCardCreateInput) => apiClient.outreach.createCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateOutreachCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OutreachCardUpdateInput) => apiClient.outreach.updateCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useMoveOutreachCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organizationId: string;
      id: string;
      columnId: string;
      beforeId: string | null;
      afterId: string | null;
    }) => apiClient.outreach.moveCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteOutreachCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; id: string }) =>
      apiClient.outreach.deleteCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useLinkOutreachContactToCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; cardId: string; contactId: string }) =>
      apiClient.outreach.linkContactToCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUnlinkOutreachContactFromCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; cardId: string; contactId: string }) =>
      apiClient.outreach.unlinkContactFromCard.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
