import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { EventFile } from "@/services/resources/file";
import { match } from "ts-pattern";
import { VideoPlayer } from "../video-player/player";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "./attachment";
import { filter } from "remeda";
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
} from "@/components/ui/alert-dialog";

export interface EventGalleryProps {
  files: EventFile[];
  onDelete?: (file: EventFile) => void;
}

export function EventGallery({ files, onDelete }: EventGalleryProps) {
  const { t } = useTranslation("calendar");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? files[selectedIndex] : undefined;
  const images = filter(files, (f) => f.kind === "image");

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Gallery")}</h3>

      <AttachmentGroup>
        {images.map((file) => (
          <>
            <Attachment key={file.originalFilename} orientation="vertical">
              <AttachmentMedia variant="image">
                <img src={file.downloadUrl} alt={file.originalFilename} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.originalFilename}</AttachmentTitle>
                <AttachmentDescription>{file.sizeBytes}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <AttachmentAction aria-label={`Remove ${file.originalFilename}`}>
                        <XIcon />
                      </AttachmentAction>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            "This will permanently delete the file. This action cannot be undone.",
                          )}
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
                <AttachmentAction aria-label={`Download ${file.originalFilename}`}>
                  <DownloadIcon />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          </>
        ))}
      </AttachmentGroup>

      <Dialog
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
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
                  <img
                    src={selected.downloadUrl}
                    alt=""
                    className="max-h-[70vh] w-full object-contain"
                  />
                ))
                .with("video", () => (
                  <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                    <VideoPlayer source={selected.downloadUrl} />
                  </div>
                ))
                .with("audio", () => null)
                .exhaustive()}

              {selectedIndex < files.length - 1 && (
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
  );
}
