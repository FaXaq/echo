import type { Meta, StoryObj } from "@storybook/react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { dataTableFeatures, type DataTableFeatures } from "@/components/ui/data-table-features";

interface Musician {
  id: string;
  name: string;
}

const data: Musician[] = Array.from({ length: 45 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Musician ${i + 1}`,
}));

const columns: ColumnDef<DataTableFeatures, Musician>[] = [{ accessorKey: "name", header: "Name" }];

function PaginationDemo() {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  return <DataTablePagination table={table} />;
}

const meta = {
  title: "UI/DataTablePagination",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaginationDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PaginationDemo />,
};
