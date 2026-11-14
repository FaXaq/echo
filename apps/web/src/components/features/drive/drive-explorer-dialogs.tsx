import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  previewFolderDeleteQueryOptions,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { FolderNameDialog } from "./folder-name-dialog";

function FolderDeleteSummary({ id, organizationId }: { id: string; organizationId: string }) {
  const { data } = useSuspenseQuery(previewFolderDeleteQueryOptions({ id, organizationId }));
  return (
    <>
      <Plural
        value={data.deletedCount}
        one="# file will be permanently deleted"
        other="# files will be permanently deleted"
      />
      {", "}
      <Plural value={data.keptCount} one="# stays in other places" other="# stay in other places" />
      {". "}
      <Trans>This action cannot be undone.</Trans>
    </>
  );
}

export function DriveExplorerDialogs({
  organizationId,
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
  bulkDeleteCount,
  onBulkDeleteCountChange,
  onConfirmBulkDeleteFiles,
}: {
  organizationId: string;
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
  bulkDeleteCount: number;
  onBulkDeleteCountChange: (open: boolean) => void;
  onConfirmBulkDeleteFiles: () => Promise<void>;
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
        description={
          deletingFolder && (
            <ErrorBoundary fallback={<Trans>This action cannot be undone.</Trans>}>
              <Suspense fallback={<Trans>Counting files…</Trans>}>
                <FolderDeleteSummary id={deletingFolder.id} organizationId={organizationId} />
              </Suspense>
            </ErrorBoundary>
          )
        }
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
        open={bulkDeleteCount > 0}
        onOpenChange={onBulkDeleteCountChange}
        variant="destructive"
        title={<Plural value={bulkDeleteCount} one="Delete # file?" other="Delete # files?" />}
        description={t`This removes the selected files from here. Files that are nowhere else are permanently deleted. This action cannot be undone.`}
        confirmLabel={t`Delete`}
        onConfirm={onConfirmBulkDeleteFiles}
      />
    </>
  );
}
