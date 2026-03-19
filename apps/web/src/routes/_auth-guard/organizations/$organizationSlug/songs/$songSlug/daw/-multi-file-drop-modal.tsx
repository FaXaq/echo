import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import type { MultiFileDropMode, PendingMultiFileDrop } from "./-daw-types";

interface MultiFileDropModalProps {
  pendingDrop: PendingMultiFileDrop;
  onConfirm: (mode: MultiFileDropMode) => void;
  onCancel: () => void;
}

/**
 * T010: Modal component for multi-file import mode selection.
 * Presents "Use existing tracks" and "Create new tracks" options.
 */
export function MultiFileDropModal({
  pendingDrop,
  onConfirm,
  onCancel,
}: MultiFileDropModalProps) {
  if (!pendingDrop) return null;

  const fileCount = pendingDrop.files.length;

  return (
    <AlertDialog open={!!pendingDrop} onOpenChange={(open) => {
      if (!open) onCancel();
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import {fileCount} Files</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how to import these {fileCount} audio files.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onConfirm("use-existing-tracks")}
            className="flex flex-col items-start gap-1 rounded border border-input p-4 text-left transition hover:bg-accent"
          >
            <span className="font-semibold">Use Existing Tracks</span>
            <span className="text-sm text-muted-foreground">
              Place files on the target track and create new tracks as needed
            </span>
          </button>
          <button
            onClick={() => onConfirm("create-new-tracks")}
            className="flex flex-col items-start gap-1 rounded border border-input p-4 text-left transition hover:bg-accent"
          >
            <span className="font-semibold">Create New Tracks</span>
            <span className="text-sm text-muted-foreground">
              Create a new track for each file
            </span>
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
