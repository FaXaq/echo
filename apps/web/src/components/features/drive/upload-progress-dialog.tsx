import { useEffect, useRef, useState } from "react";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration, formatSize } from "@/lib/file";
import { getQuotaError } from "@/lib/quota-error";
import {
  getUploadDuration,
  getUploadProgress,
  stopUpload,
  totalUploadRatio,
  useRerenderOnUploadProgress,
} from "@/lib/upload-progress";
import {
  uploadFileMutationKey,
  useCancelUploadedFilesMutation,
  type UploadFileInput,
} from "@/services/resources/drive";
import { useUploadFile } from "./use-upload-file";

function isUploadFileInput(value: unknown): value is UploadFileInput {
  return typeof value === "object" && value !== null && "file" in value;
}

function hasFileId(value: unknown): value is { id: string } {
  return typeof value === "object" && value !== null && "id" in value;
}

function useUploadRows() {
  return useMutationState({
    filters: { mutationKey: uploadFileMutationKey },
    select: (mutation) =>
      isUploadFileInput(mutation.state.variables)
        ? {
            id: mutation.mutationId,
            status: mutation.state.status,
            input: mutation.state.variables,
            error: mutation.state.error,
            fileId: hasFileId(mutation.state.data) ? mutation.state.data.id : null,
          }
        : null,
  }).filter((row) => row !== null);
}

type UploadRow = ReturnType<typeof useUploadRows>[number];

export function UploadProgressDialog() {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadFile();
  const cancelUploadedFiles = useCancelUploadedFilesMutation();
  useRerenderOnUploadProgress();
  const allRows = useUploadRows();
  const [lastHiddenUploadId, setLastHiddenUploadId] = useState(0);
  const [seenFailureIds, setSeenFailureIds] = useState<ReadonlySet<number>>(new Set());
  const [heldUploadIds, setHeldUploadIds] = useState<ReadonlySet<number> | null>(null);

  const isNew = (row: UploadRow) => row.id > lastHiddenUploadId;
  const isUnseenFailure = (row: UploadRow) => row.status === "error" && !seenFailureIds.has(row.id);
  const [minimized, setMinimized] = useState(false);
  const progressToastId = useRef<string | null>(null);
  const open = !minimized && allRows.some((row) => isNew(row) || isUnseenFailure(row));

  if (open && heldUploadIds === null) {
    setHeldUploadIds(
      new Set(
        allRows
          .filter((row) => !isNew(row) && (row.status === "pending" || isUnseenFailure(row)))
          .map((row) => row.id),
      ),
    );
  }

  const rows = allRows.filter((row) => isNew(row) || heldUploadIds?.has(row.id));
  const total = rows.length;
  const hasPending = rows.some((row) => row.status === "pending");
  const doneCount = rows.filter((row) => row.status === "success").length;
  const failedCount = rows.filter((row) => row.status === "error").length;
  const ratioOf = (row: UploadRow) =>
    row.status === "success" ? 1 : (getUploadProgress(row.input.file) ?? 0);
  const totalPercent = Math.round(
    totalUploadRatio(rows.map((row) => ({ sizeBytes: row.input.file.size, ratio: ratioOf(row) }))) *
      100,
  );

  const dismiss = () => {
    setLastHiddenUploadId(Math.max(lastHiddenUploadId, ...allRows.map((row) => row.id)));
    setSeenFailureIds(
      new Set([
        ...seenFailureIds,
        ...allRows.filter((row) => row.status === "error").map((row) => row.id),
      ]),
    );
    setHeldUploadIds(null);
  };

  const anyPending = allRows.some((row) => row.status === "pending");
  useEffect(() => {
    if (!anyPending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyPending]);

  const progressTitle = t`Uploading files · ${totalPercent}%`;
  const progressDescription = t`${doneCount} of ${total} done`;
  const detailsLabel = t`Details`;

  useEffect(() => {
    if (!minimized) return;
    if (!hasPending) {
      if (failedCount === 0) dismiss();
      setMinimized(false);
      return;
    }
    const expand = () => setMinimized(false);
    const content = {
      title: progressTitle,
      description: progressDescription,
      data: { persistent: true, onClick: expand, progress: totalPercent },
    };
    if (progressToastId.current) {
      toast.update(progressToastId.current, content);
      return;
    }
    progressToastId.current = toast.add({
      ...content,
      type: "loading",
      timeout: 0,
      actionProps: { children: detailsLabel, onClick: expand },
    });
  }, [minimized, hasPending, failedCount, totalPercent, progressTitle, progressDescription]);

  useEffect(() => {
    if (minimized || !progressToastId.current) return;
    toast.close(progressToastId.current);
    progressToastId.current = null;
  }, [minimized]);

  const stopAll = () => {
    const uploadedFiles = rows.flatMap((row) =>
      row.status === "success" && row.fileId
        ? [{ id: row.fileId, organizationId: row.input.organizationId }]
        : [],
    );
    rows.forEach(stop);
    dismiss();
    setMinimized(false);
    cancelUploadedFiles.mutate(uploadedFiles, {
      onSuccess: () => toast.add({ type: "success", title: t`Upload stopped and files deleted` }),
      onError: () =>
        toast.add({ type: "error", title: t`Some uploaded files could not be deleted` }),
    });
  };

  const forget = (row: UploadRow) => {
    const cache = queryClient.getMutationCache();
    const mutation = cache.find({ predicate: (mutation) => mutation.mutationId === row.id });
    if (mutation) cache.remove(mutation);
  };

  // The upload's own error path deletes whatever it already sent.
  const stop = (row: UploadRow) => {
    if (row.status === "pending") stopUpload(row.input.file);
    forget(row);
  };

  const retry = (row: UploadRow) => {
    forget(row);
    uploadMutation.mutate(row.input);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (open) return;
        if (hasPending) setMinimized(true);
        else dismiss();
      }}
    >
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
            <UploadRowItem
              key={row.id}
              row={row}
              onRetry={() => retry(row)}
              onStop={() => stop(row)}
            />
          ))}
        </ul>
        <DialogFooter>
          {hasPending && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" />}>
                <Trans>Stop and delete</Trans>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <Trans>Stop this upload?</Trans>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <Trans>
                      Files still uploading are stopped, and files from this upload that already
                      finished are deleted. This cannot be undone.
                    </Trans>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Trans>Keep uploading</Trans>
                  </AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={stopAll}>
                    <Trans>Stop and delete</Trans>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
  onRetry,
  onStop,
}: {
  row: UploadRow;
  onRetry: () => void;
  onStop: () => void;
}) {
  const { t } = useLingui();
  const { file } = row.input;
  const fileName = file.name;
  const durationSeconds = getUploadDuration(file);
  const ratio = getUploadProgress(file);
  const percent = Math.round((ratio ?? 0) * 100);
  const phase = ratio === undefined ? "preparing" : ratio >= 1 ? "finishing" : "transferring";
  const quotaError = getQuotaError(row.error);
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
              {quotaError?.limitName === "maxFileSizeBytes" ? (
                <Trans>Too large for your plan</Trans>
              ) : quotaError ? (
                <Trans>Plan limit reached</Trans>
              ) : (
                <Trans>Upload failed</Trans>
              )}
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
      {row.status === "pending" && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onStop}
          aria-label={t`Stop uploading ${fileName}`}
        >
          <X />
        </Button>
      )}
      {row.status === "success" && (
        <Check className="size-4 shrink-0 text-green-600" aria-label={t`Uploaded`} />
      )}
      {row.status === "error" && !quotaError && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Trans>Retry</Trans>
        </Button>
      )}
    </li>
  );
}
