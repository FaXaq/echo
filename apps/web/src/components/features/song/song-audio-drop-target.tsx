import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLingui } from "@lingui/react/macro";
import { kindForMimeType } from "@echo/modules/drive/domain";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useSongDestinationLabel } from "./song-upload-context";
import { useUploadFile } from "@/components/features/drive/use-upload-file";
import { getSongDefaultAudioQueryOptions, type SongAudioVersion } from "@/services/resources/song";

function roleForDroppedAudio(currentDefault: SongAudioVersion | null): "demo" | "final" {
  return currentDefault?.role ?? "demo";
}

export function SongAudioDropTarget({
  songId,
  organizationId,
  className,
  children,
}: {
  songId: string;
  organizationId: string;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadMutation = useUploadFile();
  const getDestinationLabel = useSongDestinationLabel(songId, organizationId);

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = [...event.dataTransfer.files].find((f) => kindForMimeType(f.type) === "audio");
    if (!file) {
      toast.add({ type: "error", title: t`Drop an audio file` });
      return;
    }

    try {
      const currentDefault = await queryClient.fetchQuery(
        getSongDefaultAudioQueryOptions({ songId, organizationId }),
      );
      uploadMutation.mutate({
        songId,
        organizationId,
        file,
        destinationLabel: getDestinationLabel(),
        songAudioRole: roleForDroppedAudio(currentDefault),
      });
    } catch {
      toast.add({ type: "error", title: t`Upload failed` });
    }
  };

  return (
    <div
      className={cn("rounded-xs", className, isDragOver && "ring-2 ring-primary bg-primary/5")}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node && event.currentTarget.contains(next))) setIsDragOver(false);
      }}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
