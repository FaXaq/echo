import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import { ConfirmDialog, type ConfirmDialogProps } from "@/components/ui/confirm-dialog";
import {
  previewFolderDeleteQueryOptions,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { FolderNameDialog } from "./folder-name-dialog";

function FolderDeleteCounts({
  folderId,
  organizationId,
  ...dialog
}: {
  folderId: string;
  organizationId: string;
} & Omit<ConfirmDialogProps, "description">) {
  const { data } = useSuspenseQuery(
    previewFolderDeleteQueryOptions({ id: folderId, organizationId }),
  );

  return (
    <ConfirmDialog
      {...dialog}
      description={
        <>
          <Plural
            value={data.deletedCount}
            one="# file will be permanently deleted"
            other="# files will be permanently deleted"
          />
          {", "}
          <Plural
            value={data.keptCount}
            one="# stays in other places"
            other="# stay in other places"
          />
          {". "}
          <Trans>This action cannot be undone.</Trans>
        </>
      }
    />
  );
}

function FolderDeleteConfirm({
  folderId,
  organizationId,
  onOpenChange,
  onConfirm,
}: {
  folderId: string;
  organizationId: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useLingui();
  const dialog = {
    open: true,
    onOpenChange,
    variant: "destructive",
    title: t`Delete this folder?`,
    confirmLabel: t`Delete`,
    onConfirm,
  } as const;

  return (
    <ErrorBoundary
      fallback={
        <ConfirmDialog
          {...dialog}
          confirmDisabled
          description={
            <Trans>Couldn't count the files in this folder. Close this and try again.</Trans>
          }
        />
      }
    >
      <Suspense
        fallback={
          <ConfirmDialog {...dialog} confirmDisabled description={<Trans>Counting files…</Trans>} />
        }
      >
        <FolderDeleteCounts folderId={folderId} organizationId={organizationId} {...dialog} />
      </Suspense>
    </ErrorBoundary>
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

      {deletingFolder && (
        <FolderDeleteConfirm
          folderId={deletingFolder.id}
          organizationId={organizationId}
          onOpenChange={onDeletingFolderChange}
          onConfirm={onConfirmDeleteFolder}
        />
      )}

      <FolderNameDialog
        open={renamingFile !== null}
        onOpenChange={onRenamingFileChange}
        title={t`Rename file`}
        initialName={renamingFile?.filename}
        onConfirm={onRenameFile}
      />
    </>
  );
}
