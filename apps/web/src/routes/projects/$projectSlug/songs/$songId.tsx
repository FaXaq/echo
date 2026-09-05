import { useState } from "react";
import type React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { UploadCloud } from "lucide-react";
import { SuspendedSongDetail } from "@/components/features/song/suspended-song-detail";
import {
  SongUploadProvider,
  useSongUploadMutation,
} from "@/components/features/song/song-upload-context";

export const Route = createFileRoute("/projects/$projectSlug/songs/$songId")({
  staticData: { title: "Song details", breadcrumb: "Song details" },
  component: OrganizationSongDetailPage,
});

function OrganizationSongDetailPage() {
  const { projectSlug, songId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () => navigate({ to: "/projects/$projectSlug/songs", params: { projectSlug } });

  return (
    <SongUploadProvider>
      <SongDropZone songId={songId} organizationId={organizationId}>
        <SuspendedSongDetail
          key={songId}
          songId={songId}
          organizationId={organizationId}
          pathname={`/${projectSlug}/songs/${songId}`}
          onBack={goBack}
        />
      </SongDropZone>
    </SongUploadProvider>
  );
}

function SongDropZone({
  songId,
  organizationId,
  children,
}: {
  songId: string;
  organizationId: string;
  children: React.ReactNode;
}) {
  const { t } = useLingui();
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useSongUploadMutation();

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    Array.from(event.dataTransfer.files).forEach((file) => {
      uploadMutation.mutate({ songId, organizationId, file });
    });
  };

  return (
    <div
      className="relative p-6 h-full"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary bg-background/90">
          <UploadCloud className="size-8 text-primary" />
          <p className="text-sm font-medium text-primary">{t`Drop files to upload`}</p>
        </div>
      )}
    </div>
  );
}
