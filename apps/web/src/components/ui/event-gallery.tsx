import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, DownloadIcon, Play, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { EventFile } from "@/services/resources/file"
import { match } from "ts-pattern"
import { VideoPlayer } from "../video-player/player"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "./attachment"
import { filter } from "remeda"
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

export interface EventGalleryProps {
  files: EventFile[]
  onDelete?: (file: EventFile) => void
}

export function EventGallery({ files, onDelete }: EventGalleryProps) {
  const { t } = useTranslation("calendar")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selected = selectedIndex !== null ? files[selectedIndex] : undefined
  const items = filter(files, (f) => f.kind === "image" || f.kind === "video")

  return (
    <div className="flex flex-col gap-2">
      <AttachmentGroup>
        {items.map((file, index) => (
          <Attachment key={file.id} orientation="vertical">
            <AttachmentTrigger
              aria-label={t("Open {{filename}}", { filename: file.originalFilename })}
              onClick={() => setSelectedIndex(index)}
            />
            <AttachmentMedia variant="image">
              {match(file.kind)
                .with("image", () => (
                  <img src={file.downloadUrl} alt={file.originalFilename} />
                ))
                .with("video", () => (
                  <div className="relative flex h-full w-full items-center justify-center bg-muted">
                    <video src={file.downloadUrl} muted preload="metadata" className="h-full w-full object-cover" />
                    <Play className="absolute size-5 text-white" fill="white" />
                  </div>
                ))
                .with("audio", "document", () => null)
                .exhaustive()}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.originalFilename}</AttachmentTitle>
              <AttachmentDescription>{file.sizeBytes}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<AttachmentAction aria-label={t("Remove {{filename}}", { filename: file.originalFilename })} />}
                  >
                    <XIcon />
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
                      <AlertDialogAction onClick={() => onDelete(file)}>
                        {t("Delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AttachmentAction
                aria-label={t("Download {{filename}}", { filename: file.originalFilename })}
                render={<a href={file.downloadUrl} download={file.originalFilename} target="_blank" rel="noreferrer" />}
              >
                <DownloadIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ))}
      </AttachmentGroup>

      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">{selected?.originalFilename}</DialogTitle>
          {selected && selectedIndex !== null && (
            <div className="relative flex items-center justify-center">
              {selectedIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute left-0"
                  aria-label={t("Previous")}
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                >
                  <ChevronLeft />
                </Button>
              )}

              {match(selected.kind)
                .with("image", () => (
                  <img src={selected.downloadUrl} alt="" className="max-h-[70vh] w-full object-contain" />
                ))
                .with("video", () => (
                  <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                    <VideoPlayer source={selected.downloadUrl} />
                  </div>
                ))
                .with("audio", "document", () => null)
                .exhaustive()}

              {selectedIndex < items.length - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0"
                  aria-label={t("Next")}
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                >
                  <ChevronRight />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
