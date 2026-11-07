import { useState } from "react";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration, formatSize } from "@/lib/file";
import {
  getUploadDuration,
  getUploadProgress,
  totalUploadRatio,
  useRerenderOnUploadProgress,
} from "@/lib/upload-progress";
import { uploadFileMutationKey, type UploadFileInput } from "@/services/resources/drive";
import { useUploadFile } from "./use-upload-file";

interface UploadRow {
  id: number;
  status: "idle" | "pending" | "success" | "error";
  input: UploadFileInput;
}

function isUploadFileInput(value: unknown): value is UploadFileInput {
  return typeof value === "object" && value !== null && "file" in value;
}

export function UploadProgressDialog() {
  const queryClient = useQueryClient();
  const uploadMutation = useUploadFile();
  useRerenderOnUploadProgress();
  const [lastHiddenUploadId, setLastHiddenUploadId] = useState(0);

  const rows = useMutationState({
    filters: { mutationKey: uploadFileMutationKey },
    select: (mutation): UploadRow | null =>
      isUploadFileInput(mutation.state.variables)
        ? {
            id: mutation.mutationId,
            status: mutation.state.status,
            input: mutation.state.variables,
          }
        : null,
  }).filter(
    (row): row is UploadRow =>
      row !== null && (row.id > lastHiddenUploadId || row.status === "pending"),
  );

  const total = rows.length;
  const lastUploadId = Math.max(0, ...rows.map((row) => row.id));
  const hasPending = rows.some((row) => row.status === "pending");
  const doneCount = rows.filter((row) => row.status === "success").length;
  const failedCount = rows.filter((row) => row.status === "error").length;
  const ratioOf = (row: UploadRow) =>
    row.status === "success" ? 1 : (getUploadProgress(row.input.file) ?? 0);
  const totalPercent = Math.round(
    totalUploadRatio(rows.map((row) => ({ sizeBytes: row.input.file.size, ratio: ratioOf(row) }))) *
      100,
  );

  const dismiss = () => setLastHiddenUploadId(lastUploadId);

  const retry = (row: UploadRow) => {
    const failed = queryClient
      .getMutationCache()
      .find({ predicate: (mutation) => mutation.mutationId === row.id });
    if (failed) queryClient.getMutationCache().remove(failed);
    uploadMutation.mutate(row.input);
  };

  return (
    <Dialog open={lastUploadId > lastHiddenUploadId} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {hasPending ? (
              <Plural value={total} one="Uploading # file" other="Uploading # files" />
            ) : (
              <Trans>
                {doneCount} of {total} files uploaded
              </Trans>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasPending ? (
              <Trans>
                {doneCount} of {total} done · {totalPercent}%
              </Trans>
            ) : failedCount > 0 ? (
              <Plural
                value={failedCount}
                one="# file failed — retry it or close this window."
                other="# files failed — retry them or close this window."
              />
            ) : (
              <Trans>All files uploaded.</Trans>
            )}
          </DialogDescription>
        </DialogHeader>
        <Progress value={totalPercent} />
        <ul className="flex max-h-80 flex-col overflow-y-auto rounded-lg border">
          {rows.map((row) => (
            <UploadRowItem key={row.id} row={row} onRetry={() => retry(row)} />
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button />}>
            {hasPending ? <Trans>Hide — keep uploading</Trans> : <Trans>Close</Trans>}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadRowItem({ row, onRetry }: { row: UploadRow; onRetry: () => void }) {
  const { t } = useLingui();
  const { file } = row.input;
  const durationSeconds = getUploadDuration(file);
  const ratio = getUploadProgress(file);
  const percent = Math.round((ratio ?? 0) * 100);
  const phase = ratio === undefined ? "preparing" : ratio >= 1 ? "finishing" : "transferring";
  const details = [
    formatSize(file.size),
    durationSeconds !== null && formatDuration(durationSeconds),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="truncate font-medium" />}>
              {file.name}
            </TooltipTrigger>
            <TooltipContent>{file.name}</TooltipContent>
          </Tooltip>
          {row.status === "error" ? (
            <span className="shrink-0 text-destructive">
              <Trans>Upload failed</Trans>
            </span>
          ) : (
            <span className="shrink-0 text-muted-foreground">{details}</span>
          )}
        </div>
        {row.status === "pending" && (
          <Progress value={phase === "transferring" ? percent : null} aria-label={file.name} />
        )}
      </div>
      {row.status === "pending" && (
        <span className="w-20 shrink-0 text-end font-medium tabular-nums">
          {phase === "preparing" ? (
            <Trans>Preparing…</Trans>
          ) : phase === "finishing" ? (
            <Trans>Finishing…</Trans>
          ) : (
            `${percent}%`
          )}
        </span>
      )}
      {row.status === "success" && (
        <Check className="size-4 shrink-0 text-green-600" aria-label={t`Uploaded`} />
      )}
      {row.status === "error" && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Trans>Retry</Trans>
        </Button>
      )}
    </li>
  );
}
