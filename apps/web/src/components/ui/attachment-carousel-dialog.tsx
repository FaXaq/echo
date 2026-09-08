import type { FileKind } from "@echo/modules/drive/domain";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { match } from "ts-pattern";
import { useEffect, useRef, useState } from "react";

const PRELOAD_RADIUS = 1;

export interface CarouselAttachment {
  id: string;
  filename: string;
  kind: FileKind;
  downloadUrl?: string;
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
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  const markLoaded = (id: string) =>
    setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

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
          <Carousel opts={{ startIndex: openIndex, loop: true }} setApi={setApi} className="w-full">
            <CarouselContent>
              {files.map((file, index) => {
                const isNearActive = Math.abs(index - activeIndex) <= PRELOAD_RADIUS;
                const isLoaded = loadedIds.has(file.id);
                return (
                  <CarouselItem
                    key={file.id}
                    className="relative flex h-[70vh] items-center justify-center"
                  >
                    {(!isNearActive || !isLoaded) && <Skeleton className="absolute inset-0" />}
                    {isNearActive &&
                      file.downloadUrl &&
                      match(file.kind)
                        .with("video", () => (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current.set(file.id, el);
                              else videoRefs.current.delete(file.id);
                            }}
                            src={file.downloadUrl}
                            controls
                            onLoadedData={() => markLoaded(file.id)}
                            className={cn(
                              "max-h-[70vh] w-full rounded-md",
                              !isLoaded && "invisible",
                            )}
                          />
                        ))
                        .otherwise(() => (
                          <img
                            src={file.downloadUrl}
                            alt={file.filename}
                            onLoad={() => markLoaded(file.id)}
                            className={cn(
                              "max-h-[70vh] w-full rounded-md object-contain",
                              !isLoaded && "invisible",
                            )}
                          />
                        ))}
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {files.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
                <div className="pt-4 text-center text-sm text-muted-foreground">
                  {activeIndex + 1} / {files.length}
                </div>
              </>
            )}
          </Carousel>
        )}
      </DialogContent>
    </Dialog>
  );
}
