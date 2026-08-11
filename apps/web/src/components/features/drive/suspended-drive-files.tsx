import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import dayjs from "dayjs";
import { FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/remeda";
import { formatSize } from "@/lib/file";
import { getOrganizationFilesQueryOptions, type OrganizationFile } from "@/services/resources/file";

const KIND_ICON = {
  audio: Music,
  video: Video,
  image: ImageIcon,
  document: FileText,
} as const;

function formatDate(date: string | null) {
  return date ? dayjs(date).format("MMM D, YYYY") : "—";
}

function FileNameCell({ file }: { file: OrganizationFile }) {
  const Icon = KIND_ICON[file.kind];
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="font-medium">{file.filename}</span>
    </div>
  );
}

function DriveFilesContent({ organizationId }: { organizationId: string }) {
  const { t } = useLingui();
  const { data: files } = useSuspenseQuery(getOrganizationFilesQueryOptions({ organizationId }));

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Table
        containerClassName="min-h-0 flex-1 border rounded border-border bg-card"
        className="m-0"
      >
        <TableHeader>
          <TableRow>
            <TableHead>
              <Trans>Name</Trans>
            </TableHead>
            <TableHead>
              <Trans>Uploaded by</Trans>
            </TableHead>
            <TableHead>
              <Trans>Date added</Trans>
            </TableHead>
            <TableHead>
              <Trans>Last modified</Trans>
            </TableHead>
            <TableHead>
              <Trans>Size</Trans>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <FileNameCell file={file} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(file.uploadedByName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{file.uploadedByName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(file.createdAt)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(file.updatedAt)}</TableCell>
              <TableCell className="text-muted-foreground">{formatSize(file.sizeBytes)}</TableCell>
            </TableRow>
          ))}
          {files.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                {t`No files yet`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <p className="mt-3 text-xs text-muted-foreground">
        <Plural value={files.length} one="# file" other="# files" />
      </p>
    </div>
  );
}

function DriveFilesError() {
  const { t } = useLingui();
  return <p className="text-sm text-destructive">{t`Couldn't load files`}</p>;
}

function DriveFilesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function SuspendedDriveFiles({ organizationId }: { organizationId: string }) {
  return (
    <ErrorBoundary FallbackComponent={DriveFilesError}>
      <Suspense fallback={<DriveFilesSkeleton />}>
        <DriveFilesContent organizationId={organizationId} />
      </Suspense>
    </ErrorBoundary>
  );
}
