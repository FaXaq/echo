import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { AudioPlayer } from "@/components/ui/audio-player"
import { getEventFilesQueryOptions } from "@/services/resources/file"

export interface EventAttachmentsProps {
  eventId: string
}

export function EventAttachments({ eventId }: EventAttachmentsProps) {
  const { t } = useTranslation("calendar")
  const { data: files = [] } = useQuery(getEventFilesQueryOptions({ eventId }))

  if (files.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Attachments")}</h3>
      <ul className="flex flex-col gap-2">
        {files.map((file) => (
          <li key={file.id} className="text-xs">
            {file.kind === "audio" ? (
              <AudioPlayer src={file.downloadUrl} filename={file.originalFilename} />
            ) : (
              <span className="truncate">{file.originalFilename}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
