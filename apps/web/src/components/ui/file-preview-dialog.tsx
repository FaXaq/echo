import { useLingui } from "@lingui/react/macro";
import { DownloadIcon, FileWarning, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { canPreviewInline } from "@/lib/file";

export interface PreviewableFile {
  filename: string;
  mimeType: string;
  downloadUrl: string;
}

export function FilePreviewDialog({
  file,
  failed,
  onOpenChange,
  onError,
  onDownload,
}: {
  file: PreviewableFile | null;
  failed: boolean;
  onOpenChange: (open: boolean) => void;
  onError: () => void;
  onDownload: () => void;
}) {
  const { t } = useLingui();

  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{file?.filename}</DialogTitle>
        {file &&
          (failed ? (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted text-sm text-destructive">
              <FileWarning className="size-6" />
              <span>{t`Couldn't load this file`}</span>
            </div>
          ) : !canPreviewInline(file.mimeType) ? (
            <Empty className="h-[60vh]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileX />
                </EmptyMedia>
                <EmptyTitle>{t`No preview available`}</EmptyTitle>
                <EmptyDescription>{t`This file type can't be previewed here.`}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={onDownload}>
                  <DownloadIcon />
                  {t`Download`}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <iframe
              ref={(node) => {
                if (!node) return;
                node.addEventListener("error", onError);
                return () => node.removeEventListener("error", onError);
              }}
              src={file.downloadUrl}
              title={file.filename}
              className="h-[60vh] w-full rounded-md border border-border"
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}
