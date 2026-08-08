import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FileWarning, Play } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { EventFile } from "@/services/resources/file"
import { match } from "ts-pattern"
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "./attachment"
import { filter } from "remeda"
import { formatSize } from "@/lib/file"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel"
import { AspectRatio } from "./aspect-ratio"

export interface EventGalleryProps {
  files: EventFile[]
  onDelete?: (file: EventFile) => void
}

export function EventGallery({ files, onDelete }: EventGalleryProps) {
  const { t } = useTranslation("calendar")
  const [startIndex, setStartIndex] = useState(0)
  const [openCarousel, setOpenCarousel] = useState<boolean>(false)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())

  const markFailed = (id: string) =>
    setFailedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  const items = filter(files, (f) => f.kind === "image" || f.kind === "video")

  return (
    <div className="flex flex-col gap-2">
      <AttachmentGroup>
        {items.map((file, index) => {
          const failed = failedIds.has(file.id)
          return (
          <Attachment key={file.id} orientation="vertical" state={failed ? "error" : "done"}>
            <AttachmentTrigger
              aria-label={t("Open {{filename}}", { filename: file.filename })}
              onClick={() => {
                setStartIndex(index)
                setOpenCarousel(true)
              }}
            />
            <AttachmentMedia variant="image">
              {failed ? (
                <FileWarning />
              ) : (
                match(file.kind)
                  .with("image", () => (
                    <img
                      src={file.downloadUrl}
                      alt={file.filename}
                      onError={() => markFailed(file.id)}
                    />
                  ))
                  .with("video", () => (
                    <div className="relative flex h-full w-full items-center justify-center bg-muted">
                      <video
                        src={file.downloadUrl}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover"
                        onError={() => markFailed(file.id)}
                      />
                      <Play className="absolute size-5 text-white" fill="white" />
                    </div>
                  ))
                  .with("audio", "document", () => null)
                  .exhaustive()
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.filename}</AttachmentTitle>
              <AttachmentDescription>
                {failed ? t("Couldn't load this file") : formatSize(file.sizeBytes)}
              </AttachmentDescription>
            </AttachmentContent>
          </Attachment>
          )
        })}
      </AttachmentGroup>

      <Dialog
        open={openCarousel}
        onOpenChange={(open) => setOpenCarousel(open)}
      >
        <DialogContent className="h-fit p-8">
          <Carousel
            opts={{
              align: "start",
              loop: false,
              startIndex,
            }}
          >
            <CarouselContent>
              {items.map((file, index) => {
                if (file.kind === "image") {
                  return <CarouselItem>
                    <AspectRatio ratio={1 / 1} className="w-full max-w-sm rounded-lg bg-muted overflow-hidden">
                      <img className="object-contain h-full w-full" src={file.downloadUrl} />
                    </AspectRatio>
                  </CarouselItem>
                } else if (file.kind === "video") {
                  return <CarouselItem>
                    <AspectRatio ratio={1 / 1} className="w-full max-w-sm rounded-lg bg-muted overflow-hidden">
                      <video className="object-contain w-full h-full" controls>
                        <source src={file.downloadUrl} />
                      </video>
                    </AspectRatio>
                  </CarouselItem>
                }
                return null;
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  )
}
