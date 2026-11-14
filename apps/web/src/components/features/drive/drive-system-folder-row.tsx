import { Folder as FolderIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

export function SystemFolderRow({ name, onNavigate }: { name: string; onNavigate: () => void }) {
  return (
    <TableRow className="cursor-pointer" onClick={onNavigate}>
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
