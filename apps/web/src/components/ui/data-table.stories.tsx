import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";

interface Musician {
  id: string;
  name: string;
  email: string;
  instrument: string;
}

const data: Musician[] = [
  { id: "1", name: "Jane Doe", email: "jane@example.com", instrument: "Guitar" },
  { id: "2", name: "Sam Lee", email: "sam@example.com", instrument: "Drums" },
  { id: "3", name: "Priya Patel", email: "priya@example.com", instrument: "Bass" },
];

const columns: ColumnDef<DataTableFeatures, Musician>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "instrument", header: "Instrument" },
];

function MusicianDataTable({ data }: { data: Musician[] }) {
  return <DataTable columns={columns} data={data} />;
}

const meta = {
  title: "UI/DataTable",
  component: MusicianDataTable,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MusicianDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data },
};

export const Empty: Story = {
  args: { data: [] },
};
