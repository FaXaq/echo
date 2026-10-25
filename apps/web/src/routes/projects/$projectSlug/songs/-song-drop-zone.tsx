import { useState } from "react";
import type React from "react";
import { useLingui } from "@lingui/react/macro";
import { UploadCloud } from "lucide-react";
import { useSongUploadMutation } from "@/components/features/song/song-upload-context";

export function SongDropZone({
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

  const isFileDrag = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");

  const handleDrop = (event: React.DragEvent) => {
    if (!isFileDrag(event)) return;
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
        if (!isFileDrag(event)) return;
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
