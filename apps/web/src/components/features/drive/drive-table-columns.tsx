import { Trans, useLingui } from "@lingui/react/macro";
import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import type { DriveSortField, DriveSortOrder } from "@/services/resources/drive";
import type { DriveRow } from "./drive-item-utils";
import { SortableHeader } from "./drive-sortable-header";

export function useDriveTableColumns({
  sort,
  order,
  onSortChange,
}: {
  sort: DriveSortField;
  order: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}): ColumnDef<DataTableFeatures, DriveRow>[] {
  const { t } = useLingui();

  return [
    { id: "select" },
    {
      id: "name",
      header: () => (
        <SortableHeader
          label={t`Name`}
          field="name"
          activeSort={sort}
          activeOrder={order}
          onSortChange={onSortChange}
        />
      ),
    },
    {
      id: "event",
      header: () => (
        <SortableHeader
          label={t`Event`}
          field="event"
          activeSort={sort}
          activeOrder={order}
          onSortChange={onSortChange}
        />
      ),
    },
    { id: "uploadedBy", header: () => <Trans>Uploaded by</Trans> },
    {
      id: "updatedAt",
      header: () => (
        <SortableHeader
          label={t`Last modified`}
          field="updatedAt"
          activeSort={sort}
          activeOrder={order}
          onSortChange={onSortChange}
        />
      ),
    },
    {
      id: "sizeBytes",
      header: () => (
        <SortableHeader
          label={t`Size`}
          field="sizeBytes"
          activeSort={sort}
          activeOrder={order}
          onSortChange={onSortChange}
        />
      ),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">
          <Trans>Actions</Trans>
        </span>
      ),
    },
  ];
}
