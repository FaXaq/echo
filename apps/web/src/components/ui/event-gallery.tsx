import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Video, X } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { EventFile } from "@/services/resources/file"

export interface EventGalleryProps {
  files: EventFile[]
  onDelete?: (file: EventFile) => void
}

export function EventGallery({ files, onDelete }: EventGalleryProps) {
  const { t } = useTranslation("calendar")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selected = selectedIndex !== null ? files[selectedIndex] : undefined

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("Gallery")}</h3>

      <div className="grid grid-cols-3 gap-2">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="group relative aspect-square overflow-hidden rounded-md bg-muted"
          >
            <button
              type="button"
              aria-label={file.originalFilename}
              onClick={() => setSelectedIndex(index)}
              className="h-full w-full"
            >
              {file.kind === "image" ? (
                <img src={file.downloadUrl} alt="" className="h-full w-full object-cover" />
              ) : file.kind === "video" ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Video className="size-6 text-muted-foreground" />
                </div>
              ) : null}
            </button>

            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t("Delete {{filename}}", { filename: file.originalFilename })}
                    className="absolute right-1 top-1 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "This will permanently delete the file. This action cannot be undone."
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
          </div>
        ))}
      </div>

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

              {selected.kind === "image" ? (
                <img
                  src={selected.downloadUrl}
                  alt=""
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : selected.kind === "video" ? (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted">
                  <Video className="size-12 text-muted-foreground" />
                </div>
              ) : null}

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
  )
}
