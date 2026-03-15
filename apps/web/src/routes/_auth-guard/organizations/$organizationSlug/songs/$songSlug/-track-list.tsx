import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];

interface TrackListProps {
  tracks: Track[];
  clips: AudioClip[];
  songId: string;
  onTrackDeleted: (trackId: string) => void;
  onVolumeChanged: (trackId: string, volume: number) => void;
  onClipUploaded: (clip: AudioClip) => void;
  onClipDeleted: (clipId: string) => void;
}

interface TrackRowProps {
  track: Track;
  clips: AudioClip[];
  isUploading: boolean;
  onVolumeChange: (trackId: string, volume: number) => void;
  onFileSelected: (trackId: string, file: File) => void;
  onDeleteTrack: (trackId: string) => void;
  onDeleteClip: (clip: AudioClip) => void;
  isTrackDeleting: boolean;
  isClipDeleting: boolean;
}

function TrackRow({
  track,
  clips,
  isUploading,
  onVolumeChange,
  onFileSelected,
  onDeleteTrack,
  onDeleteClip,
  isTrackDeleting,
  isClipDeleting,
}: TrackRowProps) {
  const { t } = useTranslation("songs");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card">
      <span className="font-medium min-w-32 truncate">{track.name}</span>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-muted-foreground">{t("Volume")}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={track.volume}
          onChange={(e) => onVolumeChange(track.id, Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm w-8">{track.volume}</span>
      </div>

      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(track.id, file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? "..." : t("Upload audio")}
        </Button>

        {clips.map((clip) => (
          <div key={clip.id} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground truncate max-w-24">
              {clip.filename}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteClip(clip)}
              disabled={isClipDeleting}
            >
              ×
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onDeleteTrack(track.id)}
        disabled={isTrackDeleting}
      >
        ×
      </Button>
    </div>
  );
}

export function TrackList({
  tracks,
  clips,
  songId: _songId,
  onTrackDeleted,
  onVolumeChanged,
  onClipUploaded,
  onClipDeleted,
}: TrackListProps) {
  const { t } = useTranslation("songs");
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const deleteTrack = trpc.organization.track.delete.useMutation();
  const updateVolume = trpc.organization.track.updateVolume.useMutation();
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const deleteClip = trpc.organization.audioClip.delete.useMutation();

  const handleVolumeChange = useCallback(
    (trackId: string, volume: number) => {
      onVolumeChanged(trackId, volume);

      const existing = debounceTimers.current.get(trackId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        updateVolume.mutate({ trackId, volume });
        debounceTimers.current.delete(trackId);
      }, 400);

      debounceTimers.current.set(trackId, timer);
    },
    [onVolumeChanged, updateVolume],
  );

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      deleteTrack.mutate(
        { trackId },
        { onSuccess: () => onTrackDeleted(trackId) },
      );
    },
    [deleteTrack, onTrackDeleted],
  );

  const handleFileSelected = useCallback(
    async (trackId: string, file: File) => {
      const contentType = file.type || "audio/mpeg";

      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      const clip = await registerClip.mutateAsync({
        trackId,
        filename: file.name,
        storageKey,
        startMeasure: 1,
      });

      onClipUploaded(clip);
    },
    [getUploadUrl, registerClip, onClipUploaded],
  );

  const handleDeleteClip = useCallback(
    (clip: AudioClip) => {
      deleteClip.mutate(
        { clipId: clip.id, storageKey: clip.storageKey },
        { onSuccess: () => onClipDeleted(clip.id) },
      );
    },
    [deleteClip, onClipDeleted],
  );

  if (tracks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        {t("Add track")} to get started.
      </p>
    );
  }

  const isUploading = getUploadUrl.isPending || registerClip.isPending;

  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          clips={clips.filter((c) => c.trackId === track.id)}
          isUploading={isUploading}
          isTrackDeleting={deleteTrack.isPending}
          isClipDeleting={deleteClip.isPending}
          onVolumeChange={handleVolumeChange}
          onFileSelected={handleFileSelected}
          onDeleteTrack={handleDeleteTrack}
          onDeleteClip={handleDeleteClip}
        />
      ))}
    </div>
  );
}
