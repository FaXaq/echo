import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
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
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import {
  getEventFilesQueryOptions,
  useDeleteFileMutation,
  useUploadFileMutation,
} from "@/services/resources/file"

export interface EventFileAttachmentsProps {
  eventId: string
  organizationId?: string
}

export function EventFileAttachments({ eventId, organizationId }: EventFileAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useQuery(getEventFilesQueryOptions({ eventId }))
  const uploadMutation = useUploadFileMutation()
  const deleteMutation = useDeleteFileMutation()

  const handleFilesSelected = (selected: File[]) => {
    selected.forEach((file) => {
      uploadMutation.mutate({ eventId, organizationId, file })
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
      <FileUpload
        accept="audio/*,video/*,image/*"
        onFilesSelected={handleFilesSelected}
        disabled={uploadMutation.isPending}
      />
      {uploadMutation.isError && (
        <p className="text-xs text-destructive">{t("Upload failed")}</p>
      )}
      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("No files attached")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">{file.originalFilename}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-xs">
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
                    <AlertDialogAction onClick={() => deleteMutation.mutate({ id: file.id })}>
                      {t("Delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
