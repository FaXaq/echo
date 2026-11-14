import { Folder as FolderIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

export function SystemFolderRow({ name, onNavigate }: { name: string; onNavigate: () => void }) {
  return (
    <TableRow
      tabIndex={0}
      className="cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate();
        }
      }}
    >
      <TableCell />
      <TableCell>
        <div className="flex items-center gap-2.5">
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  );
}
