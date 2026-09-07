import type { FileKind } from "@echo/modules/drive/domain";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { match } from "ts-pattern";

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
  const activeFile = openIndex !== null ? files[openIndex] : undefined;

  return (
    <Dialog open={openIndex !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogTitle>{activeFile?.filename}</DialogTitle>
        {openIndex !== null && (
          <Carousel opts={{ startIndex: openIndex }} className="w-full">
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
              </>
            )}
          </Carousel>
        )}
      </DialogContent>
    </Dialog>
  );
}
