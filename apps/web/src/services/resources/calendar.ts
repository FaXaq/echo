import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@echo/api/router";
import { apiClient } from "@/services/api-client";
import { initResourceKey } from "./init-resource-key";

const { key, getResourceKey } = initResourceKey("calendar");

export { key };

export type CalendarEvent = RouterOutputs["calendar"]["listEvents"][number];

export function getEventsQueryOptions(opts: { organizationId?: string } = {}) {
  return queryOptions({
    queryKey: getResourceKey("listEvents", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.calendar.listEvents.query(params, { signal });
    },
  });
}

export function getEventQueryOptions(opts: { eventId: string; organizationId?: string }) {
  return queryOptions({
    queryKey: getResourceKey("listEvents", opts),
    queryFn: async ({ queryKey, signal }) => {
      const [{ params }] = queryKey;
      return apiClient.calendar.getEventById.query(params, { signal });
    },
  });
}

export type CreateEventInput = RouterInputs["calendar"]["createEvent"];
export function useCreateEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId?: string;
  onSuccess?: (event: CalendarEvent) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      apiClient.calendar.createEvent.mutate({ organizationId, ...input }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export type UpdateEventInput = RouterInputs["calendar"]["updateEvent"];
export function useUpdateEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId?: string;
  onSuccess?: (event: CalendarEvent) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventInput) =>
      apiClient.calendar.updateEvent.mutate({ organizationId, ...input }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.(result);
    },
  });
}

export function useDeleteEventMutation({
  organizationId,
  onSuccess,
}: {
  organizationId?: string;
  onSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string }) =>
      apiClient.calendar.deleteEvent.mutate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}
