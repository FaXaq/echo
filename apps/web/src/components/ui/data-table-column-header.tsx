import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import type { Column, RowData } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import type { DataTableFeatures } from "@/ui/data-table-features";

interface DataTableColumnHeaderProps<TData extends RowData> extends React.ComponentProps<"div"> {
  column: Column<DataTableFeatures, TData, unknown>;
  title: string;
}

export function DataTableColumnHeader<TData extends RowData>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData>) {
  const { t } = useLingui();

  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="-ms-2 h-8 data-[state=open]:bg-muted" />
          }
        >
          <span>{title}</span>
          {sorted === "desc" ? <ArrowDown /> : sorted === "asc" ? <ArrowUp /> : <ChevronsUpDown />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp />
                {t`Asc`}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown />
                {t`Desc`}
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff />
              {t`Hide`}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
