import { Suspense } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EventGallery } from "@/components/ui/event-gallery";
import { FileUpload } from "@/components/ui/file-upload";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEventFilesQueryOptions,
  useDeleteFileMutation,
  useUploadFileMutation,
  type EventFile,
} from "@/services/resources/file";
import WavePlayer from "../waves-cn/wave-player";

export interface EventAttachmentsProps {
  eventId: string;
  organizationId?: string;
}

function DeleteFileButton({ file, onConfirm }: { file: EventFile; onConfirm: () => void }) {
  const { t } = useTranslation("calendar");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("Delete {{filename}}", { filename: file.originalFilename })}
        >
          ×
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("This will permanently delete the file. This action cannot be undone.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("Delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EventAttachmentsSuspended({ eventId, organizationId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar");
  const { data: files = [] } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }));
  const uploadMutation = useUploadFileMutation();
  const deleteMutation = useDeleteFileMutation();

  const audioFiles = files.filter((file) => file.kind === "audio");
  const galleryFiles = files.filter((file) => file.kind === "image" || file.kind === "video");

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <FileUpload
        accept="audio/*,video/*,image/*"
        onFilesSelected={handleFilesSelected}
        disabled={uploadMutation.isPending}
      />
      {uploadMutation.isError && (
        <p className="text-xs text-destructive">
          {t(
            uploadMutation.error instanceof Error && uploadMutation.error.message
              ? uploadMutation.error.message
              : "Upload failed",
          )}
        </p>
      )}

      {audioFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
          <ul className="flex flex-col gap-2 w-full">
            {audioFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-xs ">
                <div className="w-full">
                  <WavePlayer src={file.downloadUrl} />
                  <p>{file.originalFilename}</p>
                  <p>{t("Uploaded by {{name}}", { name: file.uploadedByName })}</p>
                </div>
                <DeleteFileButton
                  file={file}
                  onConfirm={() => deleteMutation.mutate({ id: file.id })}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && (
        <EventGallery
          files={galleryFiles}
          onDelete={(file) => deleteMutation.mutate({ id: file.id })}
        />
      )}
    </div>
  );
}

function EventAttachmentsLoader() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function EventAttachments({ eventId, organizationId }: EventAttachmentsProps) {
  return (
    <Suspense fallback={<EventAttachmentsLoader />}>
      <EventAttachmentsSuspended eventId={eventId} organizationId={organizationId} />
    </Suspense>
  );
}
