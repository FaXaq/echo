import { useRef, useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import {
  Download,
  FolderOpen,
  Folder as FolderIcon,
  MoreVertical,
  Pen,
  Trash,
  Upload,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Folder } from "@/services/resources/drive";
import { type DragData, formatDate, isFileDrag } from "./drive-item-utils";

export function FolderRow({
  folder,
  selected,
  selectionCount,
  onNavigate,
  onToggleSelect,
  onContextMenuTrigger,
  onRename,
  onDelete,
  bulkDownloadDisabledReason,
  onBulkDownload,
  isBulkDownloading,
  onOsFilesDropped,
}: {
  folder: Folder;
  selected: boolean;
  selectionCount: number;
  onNavigate: () => void;
  onToggleSelect: (event: React.MouseEvent) => void;
  onContextMenuTrigger: () => void;
  onRename: () => void;
  onDelete: () => void;
  bulkDownloadDisabledReason: string | null;
  onBulkDownload: () => void;
  isBulkDownloading: boolean;
  onOsFilesDropped: (dataTransfer: DataTransfer) => void;
}) {
  const { t } = useLingui();
  const { isDragging, ref: dragRef } = useDraggable<DragData>({
    id: `folder:${folder.id}`,
    data: { kind: "folder", id: folder.id },
  });
  const { isDropTarget, ref: dropRef } = useDroppable<DragData>({
    id: `folder:${folder.id}`,
    data: { kind: "folder", id: folder.id },
  });
  const showDragBadge = isDragging && selected && selectionCount > 1;
  const isBulkSelected = selected && selectionCount > 1;
  const [isOsDropTarget, setIsOsDropTarget] = useState(false);
  const osDragDepthRef = useRef(0);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <TableRow
            ref={(node) => {
              dragRef(node);
              dropRef(node);
            }}
            data-dragging={isDragging}
            data-drop-target={isDropTarget}
            data-os-drop-target={isOsDropTarget}
            data-state={selected ? "selected" : undefined}
            onClick={(event) => {
              if (event.shiftKey || event.metaKey || event.ctrlKey) {
                onToggleSelect(event);
              } else {
                onNavigate();
              }
            }}
            onContextMenu={onContextMenuTrigger}
            onDragEnter={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              osDragDepthRef.current += 1;
              setIsOsDropTarget(true);
            }}
            onDragOver={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
            }}
            onDragLeave={(event) => {
              if (!isFileDrag(event)) return;
              osDragDepthRef.current -= 1;
              if (osDragDepthRef.current <= 0) {
                osDragDepthRef.current = 0;
                setIsOsDropTarget(false);
              }
            }}
            onDrop={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              osDragDepthRef.current = 0;
              setIsOsDropTarget(false);
              onOsFilesDropped(event.dataTransfer);
            }}
            className="group/row cursor-pointer data-[drop-target=true]:bg-primary/5 data-[dragging=true]:opacity-50 data-[os-drop-target=true]:bg-accent data-[os-drop-target=true]:ring-1 data-[os-drop-target=true]:ring-inset data-[os-drop-target=true]:ring-primary"
          />
        }
      >
        <TableCell
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect(event);
          }}
        >
          <Checkbox
            checked={selected}
            aria-label={t`Select ${folder.name}`}
            className="pointer-events-none"
          />
        </TableCell>
        <TableCell>
          <div className="relative flex items-center gap-2.5">
            {isOsDropTarget ? (
              <Upload className="size-4 shrink-0 text-primary" />
            ) : isDropTarget ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">{folder.name}</span>
            {showDragBadge && (
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow">
                {selectionCount}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell />
        <TableCell />
        <TableCell className="text-muted-foreground">{formatDate(folder.updatedAt)}</TableCell>
        <TableCell />
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/row:opacity-100"
                  aria-label={t`Actions for ${folder.name}`}
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onRename();
                }}
              >
                <Pen />
                {t`Rename`}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Trash />
                {t`Delete`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBulkSelected ? (
          bulkDownloadDisabledReason ? (
            <Tooltip>
              <TooltipTrigger
                render={<ContextMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
              >
                <Download />
                {t`Download`}
              </TooltipTrigger>
              <TooltipContent>{bulkDownloadDisabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <ContextMenuItem onClick={onBulkDownload} disabled={isBulkDownloading}>
              {isBulkDownloading ? <Spinner className="size-4" /> : <Download />}
              {t`Download`}
            </ContextMenuItem>
          )
        ) : (
          <>
            <ContextMenuItem onClick={onRename}>
              <Pen />
              {t`Rename`}
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash />
              {t`Delete`}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
