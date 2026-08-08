import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DownloadIcon, FileText, FileWarning, MoreVertical } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EventFile } from "@/services/resources/file"

export interface DocumentAttachmentListProps {
  files: EventFile[]
  onDelete?: (file: EventFile) => void
  onRename?: (file: EventFile, filename: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentAttachmentList({ files, onDelete, onRename }: DocumentAttachmentListProps) {
  const { t } = useTranslation("calendar")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())

  const markFailed = (id: string) =>
    setFailedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  const previewFile = files.find((file) => file.id === previewId)

  const commitRename = (file: EventFile) => {
    const trimmed = renameValue.trim()
    setRenamingId(null)
    if (trimmed && trimmed !== file.originalFilename) onRename?.(file, trimmed)
  }

  const fileToDelete = files.find((f) => f.id === deleteFileId)

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {files.map((file) => {
          const failed = failedIds.has(file.id)
          return (
          <li key={file.id}>
            <Attachment orientation="horizontal" className="w-full" state={failed ? "error" : "done"}>
              <AttachmentTrigger
                aria-label={t("Open {{filename}}", { filename: file.originalFilename })}
                onClick={() => setPreviewId(file.id)}
              />
              <AttachmentMedia>
                {failed ? <FileWarning /> : <FileText />}
              </AttachmentMedia>
              <AttachmentContent>
                {renamingId === file.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(file)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(file)
                      if (e.key === "Escape") setRenamingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-20 w-full min-w-0 rounded border border-border bg-background px-1.5 py-0.5 text-sm font-medium text-foreground"
                  />
                ) : (
                  <AttachmentTitle>{file.originalFilename}</AttachmentTitle>
                )}
                <AttachmentDescription>
                  {failed ? t("Couldn't load this file") : formatSize(file.sizeBytes)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <a
                  href={file.downloadUrl}
                  download={file.originalFilename}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("Download {{filename}}", { filename: file.originalFilename })}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <DownloadIcon className="size-3.5" />
                </a>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t("Actions for {{filename}}", { filename: file.originalFilename })}
                      />
                    }
                  >
                    <MoreVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenamingId(file.id)
                        setRenameValue(file.originalFilename)
                      }}
                    >
                      {t("Rename")}
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteFileId(file.id)}
                      >
                        {t("Delete")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AttachmentActions>
            </Attachment>
          </li>
          )
        })}
      </ul>

      <Dialog open={previewFile !== undefined} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{previewFile?.originalFilename}</DialogTitle>
          {previewFile &&
            (failedIds.has(previewFile.id) ? (
              <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted text-sm text-destructive">
                <FileWarning className="size-6" />
                <span>{t("Couldn't load this file")}</span>
              </div>
            ) : (
              <iframe
                ref={(node) => {
                  if (!node) return
                  const handleError = () => markFailed(previewFile.id)
                  node.addEventListener("error", handleError)
                  return () => node.removeEventListener("error", handleError)
                }}
                src={previewFile.downloadUrl}
                title={previewFile.originalFilename}
                className="h-[60vh] w-full rounded-md border border-border"
              />
            ))}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteFileId !== null} onOpenChange={(open) => !open && setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this file?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This will permanently delete the file. This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (fileToDelete) { onDelete?.(fileToDelete); setDeleteFileId(null); } }}>
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
