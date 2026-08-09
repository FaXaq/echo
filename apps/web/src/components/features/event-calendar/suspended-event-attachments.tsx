import { Suspense, useState } from "react";
import type React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { downloadFile } from "@/lib/file";
import {
  getEventFilesQueryOptions,
  useDeleteFileMutation,
  useRenameFileMutation,
  useUploadFileMutation,
  type EventFile,
} from "@/services/resources/file";

export interface SuspendedEventAttachmentsProps {
  eventId: string;
  organizationId?: string;
}

function RenameFileForm({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: EventFile;
  onOpenChange: (open: boolean) => void;
  onConfirm: (filename: string) => void;
}) {
  const { t } = useTranslation("calendar");
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
        <DialogTitle>{t("Rename file")}</DialogTitle>
      </DialogHeader>
      <Input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>{t("Cancel")}</DialogClose>
        <Button type="submit">{t("Save")}</Button>
      </DialogFooter>
    </form>
  );
}

function RenameFileDialog({
  file,
  onOpenChange,
  onConfirm,
}: {
  file: EventFile | null;
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

function EventAttachmentsContent({ eventId, organizationId }: SuspendedEventAttachmentsProps) {
  const { t } = useTranslation("calendar");
  const { data: files } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }));
  const uploadMutation = useUploadFileMutation();
  const deleteMutation = useDeleteFileMutation();
  const renameMutation = useRenameFileMutation();
  const [renamingFile, setRenamingFile] = useState<EventFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file });
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[13px] font-semibold">{t("Linked files")}</span>
        <Badge variant="outline">
          {files.length === 1
            ? t("{{count}} file", { count: files.length })
            : t("{{count}} files", { count: files.length })}
        </Badge>
      </div>

      <FileUpload onFilesSelected={handleFilesSelected} disabled={uploadMutation.isPending} />
      {uploadMutation.isError && (
        <p className="text-xs text-destructive">
          {t(
            uploadMutation.error instanceof Error && uploadMutation.error.message
              ? uploadMutation.error.message
              : "Upload failed",
          )}
        </p>
      )}

      {files.length > 0 && (
        <AttachmentList
          files={files}
          onDelete={(file) => setDeletingFileId(file.id)}
          onRename={(file) => setRenamingFile(file)}
          onDownload={(file) => downloadFile(file.downloadUrl, file.filename)}
        />
      )}

      {files.length === 0 && (
        <p className="py-5 text-center text-[13px] text-muted-foreground">
          {t("No files linked yet.")}
        </p>
      )}

      <AlertDialog
        open={deletingFileId !== null}
        onOpenChange={(open) => !open && setDeletingFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This will permanently delete the file. This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingFileId) deleteMutation.mutate({ id: deletingFileId });
                setDeletingFileId(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RenameFileDialog
        file={renamingFile}
        onOpenChange={(open) => !open && setRenamingFile(null)}
        onConfirm={(filename) => {
          if (renamingFile) renameMutation.mutate({ id: renamingFile.id, filename });
        }}
      />
    </div>
  );
}

function EventAttachmentsError() {
  const { t } = useTranslation("calendar");
  return <p className="text-xs text-destructive">{t("Couldn't load attachments")}</p>;
}

function EventAttachmentsLoader() {
  return (
    <div className="flex flex-col gap-3.5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function SuspendedEventAttachments({
  eventId,
  organizationId,
}: SuspendedEventAttachmentsProps) {
  return (
    <ErrorBoundary FallbackComponent={EventAttachmentsError}>
      <Suspense fallback={<EventAttachmentsLoader />}>
        <EventAttachmentsContent eventId={eventId} organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
