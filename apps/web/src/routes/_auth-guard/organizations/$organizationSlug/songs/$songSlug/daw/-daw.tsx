import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/ui/button";
import { logger } from "@/lib/logger";
import { ZOOM_LEVELS, zoomIn, zoomOut } from "./-constants";
import { Timeline } from "./-timeline";
import { MultiFileDropModal } from "./-multi-file-drop-modal";
import { DawContext } from "./-daw-context";
import { useDawHistory } from "./hooks/-use-daw-history";
import { useDawPlayback } from "./hooks/-use-daw-playback";
import { useDawVolume } from "./hooks/-use-daw-volume";
import { useDawFileImport } from "./hooks/-use-daw-file-import";
import { useDawContext } from "./-daw-context";
import type { Song, Track, AudioClip, MidiClip, PendingMultiFileDrop, MultiFileDropMode, ClipSelection } from "./-daw-types";

export interface DawProps {
  song: Song;
  initialTracks: Track[];
  initialClips: AudioClip[];
  initialMidiClips: MidiClip[];
  bpm: number;
}

// ============================================================================
// Provider: owns all state, wires domain hooks, provides context
// ============================================================================

function DawProvider({
  song,
  initialTracks,
  initialClips,
  initialMidiClips,
  bpm,
  children,
}: DawProps & { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [clips, setClips] = useState<AudioClip[]>(initialClips);
  const [midiClips, setMidiClips] = useState<MidiClip[]>(initialMidiClips);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [pendingMultiDrop, setPendingMultiDrop] = useState<PendingMultiFileDrop>(null);
  const [selection, setSelection] = useState<ClipSelection>({
    audioClipIds: new Set(),
    midiClipIds: new Set(),
  });
  const [pixelsPerMeasure, setPixelsPerMeasure] = useState<number>(120);

  // tRPC queries + download URL map
  const getDownloadUrlsQuery = trpc.organization.audioClip.getDownloadUrls.useQuery(
    { storageKeys: clips.map((c) => c.file.storageKey) },
    { enabled: clips.length > 0 },
  );
  const getMidiDownloadUrlsQuery = trpc.organization.midiClip.getDownloadUrls.useQuery(
    { storageKeys: midiClips.map((c) => c.file.storageKey) },
    { enabled: midiClips.length > 0 },
  );
  const downloadUrls = useMemo(
    () =>
      new Map([
        ...(getDownloadUrlsQuery.data ?? []).map((e): [string, string] => [e.key, e.url]),
        ...(getMidiDownloadUrlsQuery.data ?? []).map((e): [string, string] => [e.key, e.url]),
      ]),
    [getDownloadUrlsQuery.data, getMidiDownloadUrlsQuery.data],
  );

  // Domain hooks
  const { pushHistory, undo, redo } = useDawHistory({
    tracks, clips, midiClips, setTracks, setClips, setMidiClips,
  });

  const {
    volumesRef,
    handlePlay,
    handleStop,
    handleExport,
    handleClipPositionChanged,
    handleMidiClipPositionChanged,
  } = useDawPlayback({
    song,
    bpm,
    clips,
    midiClips,
    tracks,
    downloadUrlsMap: downloadUrls,
    isPlaying,
    setIsPlaying,
    setIsExporting,
    setPlaybackPosition,
    setClips,
    setMidiClips,
    getDownloadUrlsQueryData: getDownloadUrlsQuery.data,
    getMidiDownloadUrlsQueryData: getMidiDownloadUrlsQuery.data,
  });

  const { handleVolumeChanged } = useDawVolume({ volumesRef, setTracks });

  const {
    handleImportUseExistingTracks,
    handleImportCreateNewTracks,
    handleBottomZoneDrop,
  } = useDawFileImport({
    song,
    tracks,
    pendingMultiDrop,
    setTracks,
    setClips,
    setMidiClips,
    setPendingMultiDrop,
    pushHistory,
  });

  // tRPC mutations for track management
  const createTrack = trpc.organization.track.create.useMutation();
  const reorderTracks = trpc.organization.track.reorder.useMutation();

  // Simple state callbacks
  const onTrackDeleted = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setClips((prev) => prev.filter((c) => c.trackId !== trackId));
    setMidiClips((prev) => prev.filter((c) => c.trackId !== trackId));
  }, []);

  const onClipUploaded = useCallback((clip: AudioClip) => {
    setClips((prev) => [...prev, clip]);
  }, []);

  const onMidiClipUploaded = useCallback((clip: MidiClip) => {
    setMidiClips((prev) => [...prev, clip]);
  }, []);

  const onClipDeleted = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  const onMidiClipDeleted = useCallback((clipId: string) => {
    setMidiClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  const onTrackRenamed = useCallback((trackId: string, name: string) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, name } : t)));
  }, []);

  const onClipRenamed = useCallback((clipId: string, name: string) => {
    setClips((prev) => prev.map((c) => (c.id === clipId ? { ...c, name } : c)));
  }, []);

  const onTracksReordered = useCallback(
    (reorderedTracks: Track[]) => {
      setTracks(reorderedTracks);
      reorderTracks.mutate(
        { songId: song.id, orderedTrackIds: reorderedTracks.map((t) => t.id) },
        {
          onError: (error) => {
            logger.error("Failed to reorder tracks:", error instanceof Error ? error.message : String(error));
          },
        },
      );
    },
    [song.id, reorderTracks],
  );

  const onAddTrack = useCallback(() => {
    createTrack.mutate(
      { songId: song.id, name: `Track ${tracks.length + 1}` },
      {
        onSuccess: (track) => {
          setTracks((prev) => [...prev, track]);
          setEditingTrackId(track.id);
        },
      },
    );
  }, [createTrack, song.id, tracks.length]);

  return (
    <DawContext.Provider
      value={{
        song,
        bpm,
        tracks,
        clips,
        midiClips,
        downloadUrls,
        isPlaying,
        isExporting,
        playbackPosition,
        editingTrackId,
        setEditingTrackId,
        selection,
        setSelection,
        setTracks,
        setClips,
        setMidiClips,
        setIsPlaying,
        setIsExporting,
        setPlaybackPosition,
        pendingMultiDrop,
        setPendingMultiDrop,
        onTrackDeleted,
        onVolumeChanged: handleVolumeChanged,
        onClipUploaded,
        onMidiClipUploaded,
        onClipPositionChanged: handleClipPositionChanged,
        onMidiClipPositionChanged: handleMidiClipPositionChanged,
        onClipDeleted,
        onMidiClipDeleted,
        onClipRenamed,
        onTrackRenamed,
        onAddTrack,
        onTracksReordered,
        onBottomZoneDrop: handleBottomZoneDrop,
        onImportUseExistingTracks: handleImportUseExistingTracks,
        onImportCreateNewTracks: handleImportCreateNewTracks,
        onPlay: handlePlay,
        onStop: handleStop,
        onExport: handleExport,
        pushHistory,
        undo,
        redo,
        pixelsPerMeasure,
        setPixelsPerMeasure,
      }}
    >
      {children}
    </DawContext.Provider>
  );
}

// ============================================================================
// Exported component
// ============================================================================

export function Daw(props: DawProps) {
  return (
    <DawProvider {...props}>
      <DawInner />
    </DawProvider>
  );
}

function DawInner() {
  const { t } = useTranslation("songs");
  const {
    isPlaying,
    isExporting,
    pendingMultiDrop,
    setPendingMultiDrop,
    onImportUseExistingTracks,
    onImportCreateNewTracks,
    onPlay,
    onStop,
    onExport,
    pixelsPerMeasure,
    setPixelsPerMeasure,
  } = useDawContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <Trans t={t}>Tracks</Trans>
        </h2>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded px-2 py-1">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-sm w-5 h-5 flex items-center justify-center"
              onClick={() => setPixelsPerMeasure(zoomOut(pixelsPerMeasure))}
              disabled={pixelsPerMeasure <= ZOOM_LEVELS[0]}
              title="Zoom out"
            >
              −
            </button>
            <input
              type="range"
              min={40}
              max={480}
              step={1}
              value={pixelsPerMeasure}
              onChange={(e) => setPixelsPerMeasure(Number(e.target.value))}
              className="w-20 accent-primary"
              title={`Zoom: ${pixelsPerMeasure}px/measure`}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-sm w-5 h-5 flex items-center justify-center"
              onClick={() => setPixelsPerMeasure(zoomIn(pixelsPerMeasure))}
              disabled={pixelsPerMeasure >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              title="Zoom in"
            >
              +
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onPlay}
            disabled={isPlaying || isExporting}
          >
            <Trans t={t}>Play</Trans>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={!isPlaying}
          >
            <Trans t={t}>Stop</Trans>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isPlaying || isExporting}
          >
            {isExporting ? <Trans t={t}>Exporting…</Trans> : <Trans t={t}>Export WAV</Trans>}
          </Button>
        </div>
      </div>

      <MultiFileDropModal
        pendingDrop={pendingMultiDrop}
        onConfirm={async (mode: MultiFileDropMode) => {
          if (!pendingMultiDrop) return;
          if (mode === "use-existing-tracks") {
            await onImportUseExistingTracks(
              pendingMultiDrop.files,
              pendingMultiDrop.targetTrackIndex,
              pendingMultiDrop.targetStartMeasure,
            );
          } else {
            await onImportCreateNewTracks(
              pendingMultiDrop.files,
              pendingMultiDrop.targetStartMeasure,
            );
          }
        }}
        onCancel={() => setPendingMultiDrop(null)}
      />

      <Timeline />
    </div>
  );
}
