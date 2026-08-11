import type { Meta, StoryObj } from "@storybook/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { VersionSwitcher } from "@/components/version-switcher";

const versions = [
  { id: "org-1", name: "Acme Inc", isPersonal: false },
  { id: "org-2", name: "Jane Doe", isPersonal: true },
];

const meta = {
  title: "Components/VersionSwitcher",
  component: VersionSwitcher,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0 w-64">
        <Story />
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof VersionSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { versions, currentVersion: "org-1", onSelect: () => {}, onCreateNew: () => {} },
};

export const PersonalActive: Story = {
  args: { versions, currentVersion: "org-2", onSelect: () => {}, onCreateNew: () => {} },
};
