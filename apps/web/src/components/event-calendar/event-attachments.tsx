import { useTranslation } from "react-i18next"
import { useSuspenseQuery } from "@tanstack/react-query"
import { AudioPlayer } from "@/components/ui/audio-player"
import { EventGallery } from "@/components/ui/event-gallery"
import { getEventFilesQueryOptions } from "@/services/resources/file"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export interface EventAttachmentsProps {
  eventId: string
}

function EventAttachmentsSuspended({ eventId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useSuspenseQuery(getEventFilesQueryOptions({ eventId }))

  const audioFiles = files.filter((file) => file.kind === "audio")
  const galleryFiles = files.filter((file) => file.kind === "image" || file.kind === "video")

  return (
    <div className="flex flex-col gap-4">
      {audioFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
          <ul className="flex flex-col gap-2">
            {audioFiles.map((file) => (
              <li key={file.id} className="text-xs">
                <AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />
                <p>{file.originalFilename}</p>
                <p>{t('Uploaded by {{name}}', { name: file.uploadedBy })}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && <EventGallery files={galleryFiles} />}
    </div>
  )
}

function EventAttachmentsLoader() {
  return <div className="flex flex-col gap-6">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
  </div>
}

export function EventAttachments({ eventId }: EventAttachmentsProps) {
  return <Suspense fallback={<EventAttachmentsLoader />}>
    <EventAttachmentsSuspended eventId={eventId} />
  </Suspense>
}
