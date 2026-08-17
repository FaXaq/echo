import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RouterOutputs } from "@echo/api/router";
import { SuspendedEventDetail } from "./suspended-event-detail";
import { getEventQueryOptions } from "@/services/resources/calendar";
import { getEventFilesQueryOptions } from "@/services/resources/drive";

type ApiEvent = RouterOutputs["calendar"]["getEventById"];

const event: ApiEvent = {
  id: "event-1",
  title: "Rehearsal",
  description: "Tighten up the bridge section.",
  startDate: "2026-08-03T19:00:00.000Z",
  endDate: "2026-08-03T21:00:00.000Z",
  allDay: false,
  color: "purple",
  type: "rehearsal",
  organization: { id: "org-1", name: "Acme Inc", slug: "acme-inc" },
  place: null,
  createdBy: "user-1",
  createdByName: "Jane Doe",
  createdAt: "2026-08-01T09:00:00.000Z",
  updatedBy: null,
};

function withSeededQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    getEventQueryOptions({ eventId: "event-1", organizationId: "org-1" }).queryKey,
    event,
  );
  queryClient.setQueryData(
    getEventFilesQueryOptions({ eventId: "event-1", organizationId: "org-1" }).queryKey,
    [],
  );
  return queryClient;
}

const meta = {
  title: "Features/EventCalendar/SuspendedEventDetail",
  component: SuspendedEventDetail,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eventId: "event-1",
    organizationId: "org-1",
    pathname: "/projects/acme-inc/calendar/event-1",
    onBack: () => {},
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededQueryClient()}>
        <div className="p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof SuspendedEventDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
