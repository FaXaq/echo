import { Suspense, useState } from "react";
import type React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { translateDynamic } from "@/lib/dynamic-messages";
import { getQuotaError } from "@/lib/quota-error";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentList } from "@/ui/attachment-list";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { downloadFile } from "@/lib/file";
import {
  getSongFilesQueryOptions,
  useDeleteFileMutation,
  useRenameFileMutation,
  type SongFile,
} from "@/services/resources/drive";
import { useSongUploadingFiles, useSongUploadMutation } from "./song-upload-context";
import { useAudioPlayerStore } from "@/stores/audio-player-store";

export interface SuspendedSongAttachmentsProps {
  songId: string;
  organizationId: string;
}

function RenameFileForm({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: SongFile;
  onOpenChange: (open: boolean) => void;
  onConfirm: (filename: string) => void;
}) {
  const { t } = useLingui();
  const [value, setValue] = useState(file.filename);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed && trimmed !== file.filename) onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t`Rename file`}</DialogTitle>
      </DialogHeader>
      <Input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>{t`Cancel`}</DialogClose>
        <Button type="submit">{t`Save`}</Button>
      </DialogFooter>
    </form>
  );
}

function RenameFileDialog({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: SongFile | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (filename: string) => void;
}) {
  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {file && (
          <RenameFileForm
            key={file.id}
            file={file}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UploadError({ error, projectSlug }: { error: unknown; projectSlug: string }) {
  const { t } = useLingui();
  const quotaError = getQuotaError(error);

  if (quotaError?.limitName === "maxFileSizeBytes") {
    return (
      <p className="text-destructive text-xs">
        <Trans>This file is too large for your plan.</Trans>
      </p>
    );
  }

  if (quotaError) {
    return (
      <p className="text-destructive text-xs">
        <Trans>
          This project has reached its plan limit.{" "}
          <Link to="/projects/$projectSlug/settings" params={{ projectSlug }} className="underline">
            View plan
          </Link>
        </Trans>
      </p>
    );
  }

  return (
    <p className="text-destructive text-xs">
      {translateDynamic(
        t,
        error instanceof Error && error.message ? error.message : "Upload failed",
      )}
    </p>
  );
}

function SongAttachmentsContent({ songId, organizationId }: SuspendedSongAttachmentsProps) {
  const { t } = useLingui();
  const { projectSlug } = useParams({ from: "/projects/$projectSlug" });
  const { data: files } = useSuspenseQuery(getSongFilesQueryOptions({ songId, organizationId }));
  const uploadMutation = useSongUploadMutation();
  const pendingFiles = useSongUploadingFiles(songId);
  const deleteMutation = useDeleteFileMutation();
  const renameMutation = useRenameFileMutation();
  const [renamingFile, setRenamingFile] = useState<SongFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const requestPlay = useAudioPlayerStore((s) => s.requestPlay);

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ songId, organizationId, file });
    });
  };

  const handleDeleteSelected = async (filesToDelete: SongFile[]) => {
    await Promise.all(
      filesToDelete.map((file) => deleteMutation.mutateAsync({ id: file.id, organizationId })),
    );
    setSelectedIds(new Set());
    toast.add({ title: t`${filesToDelete.length} files deleted`, type: "success" });
  };

  return (
    <div className="flex flex-col gap-3.5">
      {uploadMutation.isError && (
        <UploadError error={uploadMutation.error} projectSlug={projectSlug} />
      )}

      <AttachmentList
        actions={
          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={uploadMutation.isPending}
            variant="icon"
            loading={pendingFiles.length > 0}
          />
        }
        files={files}
        pendingFiles={pendingFiles}
        selectedIds={selectedIds}
        onSelect={(file) => setSelectedIds((prev) => new Set(prev).add(file.id))}
        onUnselect={(file) =>
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
          })
        }
        onDeleteSelected={handleDeleteSelected}
        onDelete={(file) => setDeletingFileId(file.id)}
        onRename={(file) => setRenamingFile(file)}
        onDownload={(file) => downloadFile(file.downloadUrl, file.filename)}
        onPlayAudio={(file) =>
          requestPlay({
            id: file.id,
            filename: file.filename,
            downloadUrl: file.downloadUrl,
            contextLabel: file.eventTitle ?? undefined,
          })
        }
      />

      <ConfirmDialog
        open={deletingFileId !== null}
        onOpenChange={(open) => !open && setDeletingFileId(null)}
        variant="destructive"
        title={t`Delete this file?`}
        description={t`This will permanently delete the file. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={async () => {
          if (!deletingFileId) return;
          await deleteMutation.mutateAsync({ id: deletingFileId, organizationId });
          toast.add({ title: t`File deleted`, type: "success" });
        }}
      />

      <RenameFileDialog
        file={renamingFile}
        onOpenChange={(open) => !open && setRenamingFile(null)}
        onConfirm={(filename) => {
          if (renamingFile)
            renameMutation.mutate({ id: renamingFile.id, organizationId, filename });
        }}
      />
    </div>
  );
}

function SongAttachmentsError() {
  const { t } = useLingui();
  return <p className="text-xs text-destructive">{t`Couldn't load attachments`}</p>;
}

function SongAttachmentsLoader() {
  return (
    <div className="flex flex-col gap-3.5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function SuspendedSongAttachments({
  songId,
  organizationId,
}: SuspendedSongAttachmentsProps) {
  return (
    <ErrorBoundary FallbackComponent={SongAttachmentsError}>
      <Suspense fallback={<SongAttachmentsLoader />}>
        <SongAttachmentsContent songId={songId} organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
