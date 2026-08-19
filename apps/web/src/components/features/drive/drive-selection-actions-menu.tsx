import { useLingui } from "@lingui/react/macro";
import { Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SelectionActionsMenu({
  downloadDisabledReason,
  isDownloading,
  onDownload,
  onClear,
}: {
  downloadDisabledReason: string | null;
  isDownloading: boolean;
  onDownload: () => void;
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
        <DropdownMenuItem onClick={onClear}>{t`Clear selection`}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
