import { useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { useDraggable } from "@dnd-kit/react";
import { Calendar as CalendarIcon, Download, MoreVertical, Pen, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatSize } from "@/lib/file";
import { getInitials } from "@/lib/remeda";
import type { OrganizationFile } from "@/services/resources/drive";
import { type DragData, KIND_ICON, formatDate } from "./drive-item-utils";

export function FileRow({
  file,
  projectSlug,
  selected,
  selectionCount,
  onToggleSelect,
  onContextMenuTrigger,
  onRename,
  onDelete,
  onDownload,
  onPlay,
  bulkDownloadDisabledReason,
  onBulkDownload,
  isBulkDownloading,
}: {
  file: OrganizationFile;
  projectSlug: string;
  selected: boolean;
  selectionCount: number;
  onToggleSelect: (event: React.MouseEvent) => void;
  onContextMenuTrigger: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPlay?: () => void;
  bulkDownloadDisabledReason: string | null;
  onBulkDownload: () => void;
  isBulkDownloading: boolean;
}) {
  const { t } = useLingui();
  const Icon = KIND_ICON[file.kind];
  const { isDragging, ref } = useDraggable<DragData>({
    id: `file:${file.id}`,
    data: { kind: "file", id: file.id },
  });
  const showDragBadge = isDragging && selected && selectionCount > 1;
  const isBulkSelected = selected && selectionCount > 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <TableRow
            ref={ref}
            data-dragging={isDragging}
            data-state={selected ? "selected" : undefined}
            onClick={(event) => {
              if (event.shiftKey || event.metaKey || event.ctrlKey) {
                onToggleSelect(event);
              } else if (file.kind === "audio" && onPlay) {
                onPlay();
              }
            }}
            onContextMenu={onContextMenuTrigger}
            className="group/row data-[dragging=true]:opacity-50"
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
            aria-label={t`Select ${file.filename}`}
            className="pointer-events-none"
          />
        </TableCell>
        <TableCell>
          <div className="relative flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{file.filename}</span>
            {showDragBadge && (
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow">
                {selectionCount}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {file.eventId && file.eventTitle && (
            <Link
              to="/projects/$projectSlug/calendar/$eventId"
              params={{ projectSlug, eventId: file.eventId }}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="size-3 shrink-0" />
              <span className="truncate">{file.eventTitle}</span>
            </Link>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px]">
                {getInitials(file.uploadedByName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{file.uploadedByName}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(file.updatedAt)}</TableCell>
        <TableCell className="text-muted-foreground">{formatSize(file.sizeBytes)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/row:opacity-100"
                  aria-label={t`Actions for ${file.filename}`}
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
                  onDownload();
                }}
              >
                <Download />
                {t`Download`}
              </DropdownMenuItem>
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
            <ContextMenuItem onClick={onDownload}>
              <Download />
              {t`Download`}
            </ContextMenuItem>
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
