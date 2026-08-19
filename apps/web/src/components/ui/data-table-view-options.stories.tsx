import type { Meta, StoryObj } from "@storybook/react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { dataTableFeatures, type DataTableFeatures } from "@/components/ui/data-table-features";

interface Musician {
  id: string;
  name: string;
  email: string;
  instrument: string;
}

const data: Musician[] = [
  { id: "1", name: "Jane Doe", email: "jane@example.com", instrument: "Guitar" },
  { id: "2", name: "Sam Lee", email: "sam@example.com", instrument: "Drums" },
];

const columns: ColumnDef<DataTableFeatures, Musician>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "instrument", header: "Instrument" },
];

function ViewOptionsDemo() {
  const table = useTable({ features: dataTableFeatures, data, columns });
  return <DataTableViewOptions table={table} />;
}

const meta = {
  title: "UI/DataTableViewOptions",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ViewOptionsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ViewOptionsDemo />,
};
