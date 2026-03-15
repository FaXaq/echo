import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import { TrackList } from "./-track-list";
import { AddTrackForm } from "./-add-track-form";
import { Timeline } from "./-timeline";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Song = RouterOutput["organization"]["song"]["get"];
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];

interface DawProps {
  song: Song;
  initialTracks: Track[];
  initialClips: AudioClip[];
}

const DEFAULT_BPM = 120;

export function Daw({ song, initialTracks, initialClips }: DawProps) {
  const { t } = useTranslation("songs");
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [clips, setClips] = useState<AudioClip[]>(initialClips);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);

  const getDownloadUrlsQuery = trpc.organization.audioClip.getDownloadUrls.useQuery(
    { storageKeys: clips.map((c) => c.storageKey) },
    { enabled: clips.length > 0 },
  );

  const handleTrackAdded = useCallback((track: Track) => {
    setTracks((prev) => [...prev, track]);
  }, []);

  const handleTrackDeleted = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
  }, []);

  const handleVolumeChanged = useCallback(
    (trackId: string, volume: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, volume } : t)),
      );
    },
    [],
  );

  const handleClipUploaded = useCallback((clip: AudioClip) => {
    setClips((prev) => [...prev, clip]);
  }, []);

  const handleClipPositionChanged = useCallback((clip: AudioClip) => {
    setClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));
  }, []);

  const handleClipDeleted = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  const handlePlay = async () => {
    if (isPlaying) return;

    const bpm = song.bpm ?? DEFAULT_BPM;
    const secondsPerMeasure = (4 * 60) / bpm;

    const urlMap = new Map(
      (getDownloadUrlsQuery.data ?? []).map((entry) => [entry.key, entry.url]),
    );

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    sourceNodesRef.current = [];

    await Promise.all(
      clips.map(async (clip) => {
        const url = urlMap.get(clip.storageKey);
        if (!url) return;

        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          const gainNode = ctx.createGain();
          const track = tracks.find((t) => t.id === clip.trackId);
          gainNode.gain.value = track ? track.volume / 100 : 1;

          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          const offsetSeconds = (clip.startMeasure - 1) * secondsPerMeasure;
          source.start(ctx.currentTime + offsetSeconds);
          sourceNodesRef.current.push(source);
        } catch {
          // skip clips that fail to decode
        }
      }),
    );

    setIsPlaying(true);
  };

  const handleStop = () => {
    sourceNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        // ignore already-stopped nodes
      }
    });
    sourceNodesRef.current = [];
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <Trans t={t}>Tracks</Trans>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={clips.length === 0}
          >
            {isPlaying ? t("Stop") : t("Play")}
          </Button>
        </div>
      </div>

      <TrackList
        tracks={tracks}
        clips={clips}
        songId={song.id}
        onTrackDeleted={handleTrackDeleted}
        onVolumeChanged={handleVolumeChanged}
        onClipUploaded={handleClipUploaded}
        onClipDeleted={handleClipDeleted}
      />

      <AddTrackForm songId={song.id} onTrackAdded={handleTrackAdded} />

      <Timeline
        tracks={tracks}
        clips={clips}
        onClipPositionChanged={handleClipPositionChanged}
      />
    </div>
  );
}
