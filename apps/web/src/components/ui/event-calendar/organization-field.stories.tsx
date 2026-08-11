import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OrganizationField } from "./organization-field";
import { selfListOrganizations } from "@/services/resources/organization";

function withSeededOrganizations() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(selfListOrganizations().queryKey, [
    { id: "org-1", name: "Acme Inc", slug: "acme-inc", isPersonal: false },
    { id: "org-2", name: "Jane Doe", slug: "jane-doe", isPersonal: true },
  ]);
  return queryClient;
}

function OrganizationFieldDemo() {
  const [value, setValue] = useState("org-1");
  return <OrganizationField value={value} onChange={setValue} />;
}

const meta = {
  title: "UI/EventCalendar/OrganizationField",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededOrganizations()}>
        <div className="w-64">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof OrganizationFieldDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <OrganizationFieldDemo />,
};

export const Disabled: Story = {
  render: () => <OrganizationField value="org-1" onChange={() => {}} disabled />,
};
