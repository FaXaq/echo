import { useRef, useCallback } from "react";
import type React from "react";
import type * as Tone from "tone";
import { trpc } from "@/lib/trpc";
import type { Track } from "../-daw-types";

interface UseDawVolumeDeps {
  volumesRef: React.MutableRefObject<Map<string, InstanceType<typeof Tone.Volume>>>;
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}

export function useDawVolume({ volumesRef, setTracks }: UseDawVolumeDeps) {
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const updateVolume = trpc.organization.track.updateVolume.useMutation();

  const handleVolumeChanged = useCallback(
    (trackId: string, volumeDb: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, volume: volumeDb } : t)),
      );

      // Live volume update during playback
      volumesRef.current.get(trackId)?.volume.rampTo(volumeDb, 0.05);

      const existing = debounceTimers.current.get(trackId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        updateVolume.mutate({ trackId, volumeDb });
        debounceTimers.current.delete(trackId);
      }, 400);

      debounceTimers.current.set(trackId, timer);
    },
    [volumesRef, setTracks, updateVolume],
  );

  return { handleVolumeChanged };
}
