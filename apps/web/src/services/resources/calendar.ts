import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("calendar");

export { key };

export type CalendarEvent = RouterOutputs["calendar"]["listUserEvents"][number];

export function getUserEventsQueryOptions() {
  return queryOptions({
    queryKey: getResourceKey("listUserEvents", undefined),
    queryFn: ({ signal }) => apiClient.calendar.listUserEvents.query(undefined, { signal }),
  });
}

export function getOrganizationEventsQueryOptions(opts: { organizationId: string }) {
  return queryOptions({
    queryKey: getResourceKey("listOrganizationEvents", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.calendar.listOrganizationEvents.query(params, { signal });
    },
  });
}

export type CreateUserEventInput = RouterInputs["calendar"]["createUserEvent"];
export function useCreateUserEventMutation({
  onSuccess,
}: { onSuccess?: (event: CalendarEvent) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserEventInput) => apiClient.calendar.createUserEvent.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export type CreateOrganizationEventInput = Omit<
  RouterInputs["calendar"]["createOrganizationEvent"],
  "organizationId"
>;
export function useCreateOrganizationEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: (event: CalendarEvent) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationEventInput) =>
      apiClient.calendar.createOrganizationEvent.mutate({ organizationId, ...input }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export type UpdateUserEventInput = RouterInputs["calendar"]["updateUserEvent"];
export function useUpdateUserEventMutation({
  onSuccess,
}: { onSuccess?: (event: CalendarEvent) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserEventInput) => apiClient.calendar.updateUserEvent.mutate(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export type UpdateOrganizationEventInput = Omit<
  RouterInputs["calendar"]["updateOrganizationEvent"],
  "organizationId"
>;
export function useUpdateOrganizationEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: (event: CalendarEvent) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationEventInput) =>
      apiClient.calendar.updateOrganizationEvent.mutate({ organizationId, ...input }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useDeleteUserEventMutation({ onSuccess }: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) => apiClient.calendar.deleteUserEvent.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useDeleteOrganizationEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.calendar.deleteOrganizationEvent.mutate({ id: input.id, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}
