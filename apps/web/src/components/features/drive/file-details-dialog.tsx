import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { FileWarning } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { formatDuration, formatSize } from "@/lib/file";
import { FileUnavailableError, readFileDetails } from "@/lib/file-details";
import { getFileDownloadUrl } from "@/services/resources/drive";

export type FileDetailsTarget = {
  id: string;
  filename: string;
  kind: string | null;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: string | Date | null;
};

function formatType(file: FileDetailsTarget) {
  const extension = file.filename.includes(".") ? file.filename.split(".").pop() : null;
  return (extension ?? file.mimeType.split("/").pop() ?? file.mimeType).toUpperCase();
}

function formatExposure(seconds: number) {
  return seconds < 1 ? `1/${Math.round(1 / seconds)} s` : `${seconds} s`;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words">{children}</dd>
    </>
  );
}

function FileDetailsContent({
  file,
  organizationId,
}: {
  file: FileDetailsTarget;
  organizationId: string;
}) {
  const { t, i18n } = useLingui();
  const formatDate = (date: string | Date) =>
    new Intl.DateTimeFormat(i18n.locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(date),
    );

  const {
    data: details,
    isPending,
    error,
  } = useQuery({
    queryKey: ["fileDetails", file.id],
    queryFn: async () => {
      const { downloadUrl } = await getFileDownloadUrl({ id: file.id, organizationId });
      return readFileDetails({ kind: file.kind, url: downloadUrl });
    },
    staleTime: Infinity,
    retry: (failureCount, queryError) =>
      !(queryError instanceof FileUnavailableError) && failureCount < 2,
  });
  const photo = details?.photo;

  return (
    <div className="flex flex-col gap-3">
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <DetailRow label={t`Format`}>{formatType(file)}</DetailRow>
        <DetailRow label={t`Size`}>{formatSize(file.sizeBytes)}</DetailRow>
        {details?.durationSeconds != null && (
          <DetailRow label={t`Duration`}>{formatDuration(details.durationSeconds)}</DetailRow>
        )}
        {details?.width != null && details.height != null && (
          <DetailRow label={t`Resolution`}>{`${details.width} × ${details.height}`}</DetailRow>
        )}
        {photo?.camera && <DetailRow label={t`Camera`}>{photo.camera}</DetailRow>}
        {photo?.aperture != null && (
          <DetailRow label={t`Aperture`}>{`f/${photo.aperture}`}</DetailRow>
        )}
        {photo?.exposureTime != null && (
          <DetailRow label={t`Shutter speed`}>{formatExposure(photo.exposureTime)}</DetailRow>
        )}
        {photo?.iso != null && <DetailRow label="ISO">{photo.iso}</DetailRow>}
        {photo?.focalLength != null && (
          <DetailRow label={t`Focal length`}>{`${photo.focalLength} mm`}</DetailRow>
        )}
        {photo?.takenAt && <DetailRow label={t`Taken on`}>{formatDate(photo.takenAt)}</DetailRow>}
        {photo?.latitude != null && photo.longitude != null && (
          <DetailRow label={t`Location`}>
            <a
              href={`https://www.openstreetmap.org/?mlat=${photo.latitude}&mlon=${photo.longitude}#map=15/${photo.latitude}/${photo.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {`${photo.latitude.toFixed(5)}, ${photo.longitude.toFixed(5)}`}
            </a>
          </DetailRow>
        )}
        <DetailRow label={t`Uploaded by`}>{file.uploadedByName}</DetailRow>
        {file.createdAt && (
          <DetailRow label={t`Uploaded on`}>{formatDate(file.createdAt)}</DetailRow>
        )}
      </dl>
      {isPending && (
        <p className="m-0 flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" />
          {t`Reading file details…`}
        </p>
      )}
      {error instanceof FileUnavailableError ? (
        <p role="alert" className="m-0 flex items-center gap-2 text-xs text-destructive">
          <FileWarning className="size-3.5 shrink-0" />
          {t`This file couldn't be loaded. It may be missing from storage.`}
        </p>
      ) : (
        error && (
          <p className="m-0 text-xs text-muted-foreground">{t`Couldn't read more details from this file.`}</p>
        )
      )}
    </div>
  );
}

export function FileDetailsDialog({
  file,
  organizationId,
  onOpenChange,
}: {
  file: FileDetailsTarget | null;
  organizationId: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">{file?.filename}</DialogTitle>
          <DialogDescription className="sr-only">{file?.filename}</DialogDescription>
        </DialogHeader>
        {file && <FileDetailsContent file={file} organizationId={organizationId} />}
      </DialogContent>
    </Dialog>
  );
}
