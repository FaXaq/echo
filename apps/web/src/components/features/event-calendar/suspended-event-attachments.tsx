import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useTranslation } from "react-i18next"
import { useSuspenseQuery } from "@tanstack/react-query"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DocumentAttachmentList } from "@/components/ui/document-attachment-list"
import { EventGallery } from "@/components/ui/event-gallery"
import { FileUpload } from "@/components/ui/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getEventFilesQueryOptions,
  useDeleteFileMutation,
  useRenameFileMutation,
  useUploadFileMutation,
  type EventFile,
} from "@/services/resources/file"
import WavePlayer from "@/components/waves-cn/wave-player"

export interface SuspendedEventAttachmentsProps {
  eventId: string
  organizationId?: string
}

function DeleteFileButton({ file, onConfirm }: { file: EventFile; onConfirm: () => void }) {
  const { t } = useTranslation("calendar")

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("Remove {{filename}}", { filename: file.originalFilename })}
          />
        }
      >
        ×
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
  )
}

function EventAttachmentsContent({ eventId, organizationId }: SuspendedEventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }))
  const uploadMutation = useUploadFileMutation()
  const deleteMutation = useDeleteFileMutation()
  const renameMutation = useRenameFileMutation()

  const audioFiles = files.filter((file) => file.kind === "audio")
  const galleryFiles = files.filter((file) => file.kind === "image" || file.kind === "video")
  const documentFiles = files.filter((file) => file.kind === "document")

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file })
    })
  }

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

      <FileUpload
        accept="audio/*,video/*,image/*,.pdf,.doc,.docx"
        onFilesSelected={handleFilesSelected}
        disabled={uploadMutation.isPending}
      />
      {uploadMutation.isError && (
        <p className="text-xs text-destructive">
          {t(
            uploadMutation.error instanceof Error && uploadMutation.error.message
              ? uploadMutation.error.message
              : "Upload failed"
          )}
        </p>
      )}

      {audioFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("Audio")}
          </h3>
          <ul className="flex w-full flex-col gap-2">
            {audioFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="w-full rounded border-subtle-foreground border-solid border-1 p-4">
                  <WavePlayer src={file.downloadUrl} errorMessage={t("Couldn't load this file")} />
                  <DeleteFileButton file={file} onConfirm={() => deleteMutation.mutate({ id: file.id })} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("Photos & videos")}
          </h3>
          <EventGallery files={galleryFiles} onDelete={(file) => deleteMutation.mutate({ id: file.id })} />
        </div>
      )}

      {documentFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("Documents")}
          </h3>
          <DocumentAttachmentList
            files={documentFiles}
            onDelete={(file) => deleteMutation.mutate({ id: file.id })}
            onRename={(file, filename) => renameMutation.mutate({ id: file.id, filename })}
          />
        </div>
      )}

      {files.length === 0 && (
        <p className="py-5 text-center text-[13px] text-muted-foreground">{t("No files linked yet.")}</p>
      )}
    </div>
  )
}

function EventAttachmentsError() {
  const { t } = useTranslation("calendar")
  return <p className="text-xs text-destructive">{t("Couldn't load attachments")}</p>
}

function EventAttachmentsLoader() {
  return (
    <div className="flex flex-col gap-3.5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export function SuspendedEventAttachments({ eventId, organizationId }: SuspendedEventAttachmentsProps) {
  return (
    <ErrorBoundary FallbackComponent={EventAttachmentsError}>
      <Suspense fallback={<EventAttachmentsLoader />}>
        <EventAttachmentsContent eventId={eventId} organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  )
}
