import type { Meta, StoryObj } from "@storybook/react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { dataTableFeatures, type DataTableFeatures } from "@/components/ui/data-table-features";

interface Musician {
  id: string;
  name: string;
  instrument: string;
}

const data: Musician[] = [
  { id: "1", name: "Jane Doe", instrument: "Guitar" },
  { id: "2", name: "Sam Lee", instrument: "Drums" },
];

const columns: ColumnDef<DataTableFeatures, Musician>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "instrument", header: "Instrument", enableSorting: false, enableHiding: false },
];

function ColumnHeaderDemo({ columnId, title }: { columnId: string; title: string }) {
  const table = useTable({ features: dataTableFeatures, data, columns });
  const column = table.getColumn(columnId);
  if (!column) return null;
  return <DataTableColumnHeader column={column} title={title} />;
}

const meta = {
  title: "UI/DataTableColumnHeader",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ColumnHeaderDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sortable: Story = {
  render: () => <ColumnHeaderDemo columnId="name" title="Name" />,
};

export const NotSortable: Story = {
  render: () => <ColumnHeaderDemo columnId="instrument" title="Instrument" />,
};
