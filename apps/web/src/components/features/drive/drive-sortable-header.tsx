import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DriveSortField, DriveSortOrder } from "@/services/resources/drive";

export function SortableHeader({
  label,
  field,
  activeSort,
  activeOrder,
  onSortChange,
}: {
  label: string;
  field: DriveSortField;
  activeSort: DriveSortField;
  activeOrder: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
}) {
  const isActive = activeSort === field;
  const Icon = isActive ? (activeOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", !isActive && "text-muted-foreground")}
      onClick={() => onSortChange(field)}
    >
      {label}
      <Icon className="size-3.5" />
    </Button>
  );
}
