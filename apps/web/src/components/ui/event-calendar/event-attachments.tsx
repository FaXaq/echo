import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { AudioPlayer } from "@/components/ui/audio-player"
import { EventGallery } from "@/components/ui/event-gallery"
import { getEventFilesQueryOptions } from "@/services/resources/file"

export interface EventAttachmentsProps {
  eventId: string
}

export function EventAttachments({ eventId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useQuery(getEventFilesQueryOptions({ eventId }))

  if (files.length === 0) return null

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
              </li>
            ))}
          </ul>
        </div>
      )}

      {galleryFiles.length > 0 && <EventGallery files={galleryFiles} />}
    </div>
  )
}
