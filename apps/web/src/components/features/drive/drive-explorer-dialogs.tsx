import { useLingui } from "@lingui/react/macro";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Folder, OrganizationFile } from "@/services/resources/drive";
import { FolderNameDialog } from "./folder-name-dialog";

export function DriveExplorerDialogs({
  creatingFolder,
  onCreatingFolderChange,
  onCreateFolder,
  renamingFolder,
  onRenamingFolderChange,
  onRenameFolder,
  deletingFolder,
  onDeletingFolderChange,
  onConfirmDeleteFolder,
  renamingFile,
  onRenamingFileChange,
  onRenameFile,
  deletingFile,
  onDeletingFileChange,
  onConfirmDeleteFile,
}: {
  creatingFolder: boolean;
  onCreatingFolderChange: (open: boolean) => void;
  onCreateFolder: (name: string) => void;
  renamingFolder: Folder | null;
  onRenamingFolderChange: (open: boolean) => void;
  onRenameFolder: (name: string) => void;
  deletingFolder: Folder | null;
  onDeletingFolderChange: (open: boolean) => void;
  onConfirmDeleteFolder: () => void;
  renamingFile: OrganizationFile | null;
  onRenamingFileChange: (open: boolean) => void;
  onRenameFile: (filename: string) => void;
  deletingFile: OrganizationFile | null;
  onDeletingFileChange: (open: boolean) => void;
  onConfirmDeleteFile: () => void;
}) {
  const { t } = useLingui();

  return (
    <>
      <FolderNameDialog
        open={creatingFolder}
        onOpenChange={onCreatingFolderChange}
        title={t`New folder`}
        onConfirm={onCreateFolder}
      />

      <FolderNameDialog
        open={renamingFolder !== null}
        onOpenChange={onRenamingFolderChange}
        title={t`Rename folder`}
        initialName={renamingFolder?.name}
        onConfirm={onRenameFolder}
      />

      <ConfirmDialog
        open={deletingFolder !== null}
        onOpenChange={onDeletingFolderChange}
        variant="destructive"
        title={t`Delete this folder?`}
        description={t`This permanently deletes the folder and any files inside it that aren't attached to an event or song. Files still attached elsewhere are kept and simply removed from this folder. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={onConfirmDeleteFolder}
      />

      <FolderNameDialog
        open={renamingFile !== null}
        onOpenChange={onRenamingFileChange}
        title={t`Rename file`}
        initialName={renamingFile?.filename}
        onConfirm={onRenameFile}
      />

      <ConfirmDialog
        open={deletingFile !== null}
        onOpenChange={onDeletingFileChange}
        variant="destructive"
        title={t`Delete this file?`}
        description={t`This permanently deletes the file, including from any event or song it's attached to. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={onConfirmDeleteFile}
      />
    </>
  );
}
