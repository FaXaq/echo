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
import { match } from "ts-pattern";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (openIndex !== null) setActiveIndex(openIndex);
  }, [openIndex]);

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
              {files.map((file) => (
                <CarouselItem key={file.id} className="flex items-center justify-center">
                  {match(file.kind)
                    .with("video", () => (
                      <video
                        src={file.downloadUrl}
                        controls
                        className="max-h-[70vh] w-full rounded-md"
                      />
                    ))
                    .otherwise(() => (
                      <img
                        src={file.downloadUrl}
                        alt={file.filename}
                        className="max-h-[70vh] w-full rounded-md object-contain"
                      />
                    ))}
                </CarouselItem>
              ))}
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
