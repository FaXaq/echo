import { queryOptions } from "@tanstack/react-query";
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
export function createUserEvent(input: CreateUserEventInput) {
  return apiClient.calendar.createUserEvent.mutate(input);
}

export type CreateOrganizationEventInput = RouterInputs["calendar"]["createOrganizationEvent"];
export function createOrganizationEvent(input: CreateOrganizationEventInput) {
  return apiClient.calendar.createOrganizationEvent.mutate(input);
}

export type UpdateUserEventInput = RouterInputs["calendar"]["updateUserEvent"];
export function updateUserEvent(input: UpdateUserEventInput) {
  return apiClient.calendar.updateUserEvent.mutate(input);
}

export type UpdateOrganizationEventInput = RouterInputs["calendar"]["updateOrganizationEvent"];
export function updateOrganizationEvent(input: UpdateOrganizationEventInput) {
  return apiClient.calendar.updateOrganizationEvent.mutate(input);
}

export function deleteUserEvent(input: { id: string }) {
  return apiClient.calendar.deleteUserEvent.mutate(input);
}

export function deleteOrganizationEvent(input: { id: string; organizationId: string }) {
  return apiClient.calendar.deleteOrganizationEvent.mutate(input);
}
