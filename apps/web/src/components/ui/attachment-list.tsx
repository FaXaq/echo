import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { DownloadIcon, FileText, FileWarning, MoreVertical, Pen, Trash } from "lucide-react";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EventFile } from "@/services/resources/drive";
import { formatSize } from "@/lib/file";

export interface AttachmentListProps {
  files: EventFile[];
  onDelete?: (file: EventFile) => void;
  onRename?: (file: EventFile) => void;
  onDownload?: (file: EventFile) => void;
}

export function AttachmentList({ files, onDelete, onRename, onDownload }: AttachmentListProps) {
  const { t } = useLingui();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const markFailed = (id: string) =>
    setFailedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const previewFile = files.find((file) => file.id === previewId);

  return (
    <>
      <ul className="flex flex-col gap-2.5 m-0 p-0">
        {files.map((file) => {
          const failed = failedIds.has(file.id);
          return (
            <li key={file.id} className="m-0 p-0 list-none">
              <Attachment
                orientation="horizontal"
                className="w-full"
                state={failed ? "error" : "done"}
              >
                <AttachmentTrigger
                  aria-label={t`Open ${file.filename}`}
                  onClick={() => setPreviewId(file.id)}
                />
                <AttachmentMedia>{failed ? <FileWarning /> : <FileText />}</AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.filename}</AttachmentTitle>
                  <AttachmentDescription>
                    {failed ? t`Couldn't load this file` : formatSize(file.sizeBytes)}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t`Actions for ${file.filename}`}
                        />
                      }
                    >
                      <MoreVertical />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onRename && (
                        <DropdownMenuItem
                          onClick={() => {
                            onRename(file);
                          }}
                        >
                          <Pen />
                          {t`Rename`}
                        </DropdownMenuItem>
                      )}
                      {onDownload && (
                        <DropdownMenuItem
                          onClick={() => {
                            onDownload(file);
                          }}
                        >
                          <DownloadIcon />
                          {t`Download`}
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}>
                          <Trash />
                          {t`Delete`}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AttachmentActions>
              </Attachment>
            </li>
          );
        })}
      </ul>

      <Dialog open={previewFile !== undefined} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent>
          <DialogTitle>{previewFile?.filename}</DialogTitle>
          {previewFile &&
            (failedIds.has(previewFile.id) ? (
              <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted text-sm text-destructive">
                <FileWarning className="size-6" />
                <span>{t`Couldn't load this file`}</span>
              </div>
            ) : (
              <iframe
                ref={(node) => {
                  if (!node) return;
                  const handleError = () => markFailed(previewFile.id);
                  node.addEventListener("error", handleError);
                  return () => node.removeEventListener("error", handleError);
                }}
                src={previewFile.downloadUrl}
                title={previewFile.filename}
                className="h-[60vh] w-full rounded-md border border-border"
              />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
