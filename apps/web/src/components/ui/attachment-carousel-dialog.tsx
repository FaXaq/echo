import type { FileKind } from "@echo/modules/drive/domain";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { match } from "ts-pattern";
import { useEffect, useRef, useState } from "react";

const PRELOAD_RADIUS = 1;

export interface CarouselAttachment {
  id: string;
  filename: string;
  kind: FileKind;
  downloadUrl: string;
}

export interface AttachmentCarouselDialogProps {
  files: CarouselAttachment[];
  openIndex: number | null;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentCarouselDialog({
  files,
  openIndex,
  onOpenChange,
}: AttachmentCarouselDialogProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(openIndex ?? 0);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  // Reset to the newly opened file each time the dialog is reopened on a different item.
  useEffect(() => {
    if (openIndex !== null) setActiveIndex(openIndex);
  }, [openIndex]);

  // Embla keeps every slide mounted, so a video left off-screen keeps playing unless paused here.
  useEffect(() => {
    const activeId = files[activeIndex]?.id;
    for (const [id, video] of videoRefs.current) {
      if (id !== activeId) video.pause();
    }
  }, [activeIndex, files]);

  // Embla only exposes the current slide via its own "select" event, not as React state.
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const activeFile = files[activeIndex];

  return (
    <Dialog open={openIndex !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogTitle>{activeFile?.filename}</DialogTitle>
        {openIndex !== null && (
          <Carousel opts={{ startIndex: openIndex }} setApi={setApi} className="w-full">
            <CarouselContent>
              {files.map((file, index) => {
                const isNearActive = Math.abs(index - activeIndex) <= PRELOAD_RADIUS;
                return (
                  <CarouselItem key={file.id} className="flex items-center justify-center">
                    {!isNearActive ? (
                      <Skeleton className="h-[70vh] w-full" />
                    ) : (
                      match(file.kind)
                        .with("video", () => (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current.set(file.id, el);
                              else videoRefs.current.delete(file.id);
                            }}
                            src={file.downloadUrl}
                            controls
                            className="max-h-[70vh] w-full rounded-md"
                          />
                        ))
                        .otherwise(() => (
                          <img
                            src={file.downloadUrl}
                            alt={file.filename}
                            loading="lazy"
                            className="max-h-[70vh] w-full rounded-md object-contain"
                          />
                        ))
                    )}
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {files.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
                <CarouselDots className="pt-4" />
              </>
            )}
          </Carousel>
        )}
      </DialogContent>
    </Dialog>
  );
}
