import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
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
  bpm: number;
}

export function Daw({ song, initialTracks, initialClips, bpm }: DawProps) {
  const { t } = useTranslation("songs");
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [clips, setClips] = useState<AudioClip[]>(initialClips);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const playbackStartAudioTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const updateVolume = trpc.organization.track.updateVolume.useMutation();
  const createTrack = trpc.organization.track.create.useMutation();

  const getDownloadUrlsQuery = trpc.organization.audioClip.getDownloadUrls.useQuery(
    { storageKeys: clips.map((c) => c.file.storageKey) },
    { enabled: clips.length > 0 },
  );

  const handleTrackDeleted = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
  }, []);

  const handleVolumeChanged = useCallback(
    (trackId: string, volume: number) => {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, volume } : t)),
      );

      const existing = debounceTimers.current.get(trackId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        updateVolume.mutate({ trackId, volume });
        debounceTimers.current.delete(trackId);
      }, 400);

      debounceTimers.current.set(trackId, timer);
    },
    [updateVolume],
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

  const handleTrackRenamed = useCallback((trackId: string, name: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, name } : t)),
    );
  }, []);

  const handleClipRenamed = useCallback((clipId: string, name: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, name } : c)),
    );
  }, []);

  const downloadUrlsMap = useMemo(
    () =>
      new Map(
        (getDownloadUrlsQuery.data ?? []).map((e) => [e.key, e.url]),
      ),
    [getDownloadUrlsQuery.data],
  );

  const handleAddTrack = useCallback(() => {
    const name = `Track ${tracks.length + 1}`;
    createTrack.mutate(
      { songId: song.id, name },
      {
        onSuccess: (track) => {
          setTracks((prev) => [...prev, track]);
          setEditingTrackId(track.id);
        },
      },
    );
  }, [createTrack, song.id, tracks.length]);

  const handlePlay = async () => {
    if (isPlaying) return;

    const secondsPerMeasure = (4 * 60) / bpm;

    const urlMap = new Map(
      (getDownloadUrlsQuery.data ?? []).map((entry) => [entry.key, entry.url]),
    );

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    sourceNodesRef.current = [];

    await Promise.all(
      clips.map(async (clip) => {
        const url = urlMap.get(clip.file.storageKey);
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

    playbackStartAudioTimeRef.current = ctx.currentTime;
    const tick = () => {
      if (!audioCtxRef.current) return;
      const elapsed =
        audioCtxRef.current.currentTime - playbackStartAudioTimeRef.current;
      setPlaybackPosition(elapsed / secondsPerMeasure);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handleStop = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setPlaybackPosition(0);
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

      <Timeline
        tracks={tracks}
        clips={clips}
        bpm={bpm}
        playbackPosition={playbackPosition}
        isPlaying={isPlaying}
        organizationId={song.organizationId}
        editingTrackId={editingTrackId}
        downloadUrls={downloadUrlsMap}
        onClipPositionChanged={handleClipPositionChanged}
        onVolumeChanged={handleVolumeChanged}
        onTrackDeleted={handleTrackDeleted}
        onClipUploaded={handleClipUploaded}
        onClipDeleted={handleClipDeleted}
        onClipRenamed={handleClipRenamed}
        onEditingTrackIdChange={setEditingTrackId}
        onTrackRenamed={handleTrackRenamed}
        onAddTrack={handleAddTrack}
      />
    </div>
  );
}
