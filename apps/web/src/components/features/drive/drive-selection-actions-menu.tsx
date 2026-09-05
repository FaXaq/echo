import { useLingui } from "@lingui/react/macro";
import { Download, MoreVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SelectionActionsMenu({
  downloadDisabledReason,
  isDownloading,
  onDownload,
  deleteDisabledReason,
  onDelete,
  onClear,
}: {
  downloadDisabledReason: string | null;
  isDownloading: boolean;
  onDownload: () => void;
  deleteDisabledReason: string | null;
  onDelete: () => void;
  onClear: () => void;
}) {
  const { t } = useLingui();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t`Selection actions`}
          />
        }
      >
        <MoreVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {downloadDisabledReason ? (
          <Tooltip>
            <TooltipTrigger
              render={<DropdownMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
            >
              <Download />
              {t`Download`}
            </TooltipTrigger>
            <TooltipContent>{downloadDisabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? <Spinner className="size-4" /> : <Download />}
            {t`Download`}
          </DropdownMenuItem>
        )}
        {deleteDisabledReason ? (
          <Tooltip>
            <TooltipTrigger
              render={<DropdownMenuItem aria-disabled className="cursor-not-allowed opacity-50" />}
            >
              <Trash />
              {t`Delete`}
            </TooltipTrigger>
            <TooltipContent>{deleteDisabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash />
            {t`Delete`}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClear}>{t`Clear selection`}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
