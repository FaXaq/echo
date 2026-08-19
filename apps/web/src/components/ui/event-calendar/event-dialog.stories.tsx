import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EventDialog, type EventDialogState } from "./event-dialog";
import { selfListOrganizations } from "@/services/resources/organization";
import type { CalendarEvent } from "./types";

function withSeededOrganizations() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(selfListOrganizations().queryKey, [
    { id: "org-1", name: "Acme Inc", slug: "acme-inc", isPersonal: false },
  ]);
  return queryClient;
}

const editEvent: CalendarEvent = {
  id: "1",
  title: "Rehearsal",
  description: "Tighten up the bridge section.",
  startDate: new Date("2026-08-03T19:00:00"),
  endDate: new Date("2026-08-03T21:00:00"),
  color: "purple",
  type: "rehearsal",
  organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
  place: null,
  createdBy: "user-1",
  createdByName: "Jane Doe",
  createdAt: new Date("2026-08-01T09:00:00"),
};

const meta = {
  title: "UI/EventCalendar/EventDialog",
  component: EventDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    defaultOrganizationId: "org-1",
    onOpenChange: () => {},
    onSubmit: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededOrganizations()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof EventDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    state: {
      mode: "create",
      range: { start: new Date("2026-08-03T09:00:00"), end: new Date("2026-08-03T10:00:00") },
    } satisfies EventDialogState,
  },
};

export const Edit: Story = {
  args: {
    state: { mode: "edit", event: editEvent } satisfies EventDialogState,
  },
};
