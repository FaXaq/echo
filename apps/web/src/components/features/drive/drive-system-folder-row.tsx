import { useLingui } from "@lingui/react/macro";
import { ClipboardPaste, Folder as FolderIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatSize } from "@/lib/file";
import { TableCell, TableRow } from "@/components/ui/table";

export function SystemFolderRow({
  name,
  sizeBytes,
  onNavigate,
  canPaste,
  onPasteInto,
}: {
  name: string;
  sizeBytes: number;
  onNavigate: () => void;
  canPaste: boolean;
  onPasteInto?: () => void;
}) {
  const { t } = useLingui();
  const rowProps = {
    tabIndex: 0,
    className:
      "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
    onClick: onNavigate,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onNavigate();
      }
    },
  };
  const cells = (
    <>
      <TableCell />
      <TableCell>
        <div className="flex items-center gap-2.5">
          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{name}</span>
        </div>
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell className="text-muted-foreground">{formatSize(sizeBytes)}</TableCell>
      <TableCell />
    </>
  );

  if (!onPasteInto) return <TableRow {...rowProps}>{cells}</TableRow>;

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<TableRow {...rowProps} />}>{cells}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onPasteInto} disabled={!canPaste}>
          <ClipboardPaste />
          {t`Paste into`}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
