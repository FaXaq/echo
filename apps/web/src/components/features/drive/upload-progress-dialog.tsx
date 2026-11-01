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
  getUploadProgress,
  totalUploadRatio,
  useUploadProgressVersion,
} from "@/lib/upload-progress";
import {
  uploadFileMutationKey,
  useUploadFileMutation,
  type UploadFileInput,
} from "@/services/resources/drive";

interface UploadRow {
  id: number;
  status: "idle" | "pending" | "success" | "error";
  input: UploadFileInput;
  durationSeconds: number | null;
}

function isUploadFileInput(value: unknown): value is UploadFileInput {
  return typeof value === "object" && value !== null && "file" in value;
}

function durationOf(uploaded: unknown) {
  return typeof uploaded === "object" &&
    uploaded !== null &&
    "durationSeconds" in uploaded &&
    typeof uploaded.durationSeconds === "number"
    ? uploaded.durationSeconds
    : null;
}

export function UploadProgressDialog() {
  const queryClient = useQueryClient();
  const uploadMutation = useUploadFileMutation();
  useUploadProgressVersion();
  const [hiddenUpTo, setHiddenUpTo] = useState(0);
  const [clearedUpTo, setClearedUpTo] = useState(0);

  const rows = useMutationState({
    filters: { mutationKey: uploadFileMutationKey },
    select: (mutation): UploadRow | null =>
      isUploadFileInput(mutation.state.variables)
        ? {
            id: mutation.mutationId,
            status: mutation.state.status,
            input: mutation.state.variables,
            durationSeconds: durationOf(mutation.state.data),
          }
        : null,
  }).filter((row): row is UploadRow => row !== null && row.id > clearedUpTo);

  const lastId = Math.max(0, ...rows.map((row) => row.id));
  const hasPending = rows.some((row) => row.status === "pending");
  const doneCount = rows.filter((row) => row.status === "success").length;
  const failedCount = rows.filter((row) => row.status === "error").length;
  const ratioOf = (row: UploadRow) =>
    row.status === "success" ? 1 : getUploadProgress(row.input.file);
  const totalPercent = Math.round(
    totalUploadRatio(
      rows
        .filter((row) => row.status !== "error")
        .map((row) => ({ sizeBytes: row.input.file.size, ratio: ratioOf(row) })),
    ) * 100,
  );

  const dismiss = () => {
    setHiddenUpTo(lastId);
    if (!hasPending) setClearedUpTo(lastId);
  };

  const retry = (row: UploadRow) => {
    const failed = queryClient
      .getMutationCache()
      .find({ predicate: (mutation) => mutation.mutationId === row.id });
    if (failed) queryClient.getMutationCache().remove(failed);
    uploadMutation.mutate(row.input);
  };

  return (
    <Dialog open={lastId > hiddenUpTo} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {hasPending ? (
              <Plural value={rows.length} one="Uploading # file" other="Uploading # files" />
            ) : (
              <Trans>
                {doneCount} of {rows.length} files uploaded
              </Trans>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasPending ? (
              <Trans>
                {doneCount} of {rows.length} done · {totalPercent}%
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
            <UploadRowItem
              key={row.id}
              row={row}
              percent={Math.round(ratioOf(row) * 100)}
              onRetry={() => retry(row)}
            />
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

function UploadRowItem({
  row,
  percent,
  onRetry,
}: {
  row: UploadRow;
  percent: number;
  onRetry: () => void;
}) {
  const { t } = useLingui();
  const { file } = row.input;
  const details = [
    formatSize(file.size),
    row.durationSeconds !== null && formatDuration(row.durationSeconds),
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
        {row.status === "pending" && <Progress value={percent} aria-label={file.name} />}
      </div>
      {row.status === "pending" && (
        <span className="w-10 shrink-0 text-end font-medium tabular-nums">{percent}%</span>
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
