import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Slider } from "@/ui/slider";
import { PhantomInput } from "@/ui/phantom-input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@echo/api/router";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Track = RouterOutput["organization"]["track"]["list"][number];
type AudioClip = RouterOutput["organization"]["audioClip"]["listBySong"][number];
type MidiClip = RouterOutput["organization"]["midiClip"]["listBySong"][number];

const PIXELS_PER_MEASURE = 120;
const TRACK_HEIGHT = 64;
const RULER_HEIGHT = 32;
const MIN_MEASURES = 32;
const BUFFER_MEASURES = 8;
const LEFT_PANEL_WIDTH = 200;
const SCROLL_THRESHOLD = 80;
const SCROLL_MAX_SPEED = 14;

// General MIDI program names (128 presets)
const GM_INSTRUMENT_NAMES = [
  "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
  "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavinet", "Celesta", "Glockenspiel",
  "Music Box", "Vibraphone", "Marimba", "Xylophone", "Tubular Bells", "Dulcimer", "Drawbar Organ",
  "Percussive Organ", "Rock Organ", "Church Organ", "Reed Organ", "Accordion", "Harmonica",
  "Tango Accordion", "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)",
  "Electric Guitar (clean)", "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar",
  "Guitar harmonics", "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)",
  "Fretless Bass", "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2", "Violin", "Viola",
  "Cello", "Contrabass", "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",
  "String Ensemble 1", "String Ensemble 2", "SynthStrings 1", "SynthStrings 2", "Choir Aahs",
  "Voice Oohs", "Synth Voice", "Orchestra Hit", "Trumpet", "Trombone", "Tuba", "Muted Trumpet",
  "French Horn", "Brass Section", "SynthBrass 1", "SynthBrass 2", "Soprano Sax", "Alto Sax",
  "Tenor Sax", "Baritone Sax", "Oboe", "English Horn", "Bassoon", "Clarinet", "Piccolo", "Flute",
  "Recorder", "Pan Flute", "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina", "Lead 1 (square)",
  "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)", "Lead 5 (charang)", "Lead 6 (voice)",
  "Lead 7 (fifths)", "Lead 8 (bass + lead)", "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)",
  "Pad 4 (choir)", "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",
  "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)", "FX 5 (brightness)",
  "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)", "Sitar", "Banjo", "Shamisen", "Koto", "Kalimba",
  "Bag pipe", "Fiddle", "Shanai", "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock", "Taiko Drum",
  "Melodic Tom", "Synth Drum", "Reverse Cymbal", "Guitar Fret Noise", "Breath Noise", "Seashore",
  "Bird Tweet", "Telephone Ring", "Helicopter", "Applause", "Gunshot",
];

function getAudioDurationMs(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(
        Number.isFinite(audio.duration)
          ? Math.round(audio.duration * 1000)
          : undefined,
      );
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    audio.src = url;
  });
}

interface TimelineProps {
  tracks: Track[];
  clips: AudioClip[];
  midiClips: MidiClip[];
  bpm: number;
  playbackPosition: number;
  isPlaying: boolean;
  organizationId: string;
  editingTrackId: string | null;
  downloadUrls: Map<string, string>;
  onClipPositionChanged: (clip: AudioClip) => void;
  onMidiClipPositionChanged: (clip: MidiClip) => void;
  onVolumeChanged: (trackId: string, volume: number) => void;
  onTrackDeleted: (trackId: string) => void;
  onClipUploaded: (clip: AudioClip) => void;
  onMidiClipUploaded: (clip: MidiClip) => void;
  onClipDeleted: (clipId: string) => void;
  onMidiClipDeleted: (clipId: string) => void;
  onClipRenamed: (clipId: string, name: string) => void;
  onEditingTrackIdChange: (id: string | null) => void;
  onTrackRenamed: (trackId: string, name: string) => void;
  onAddTrack: () => void;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

// T003: Detect file type from DataTransferItemList (during dragover — filename not yet available)
function detectFileTypeFromItems(items: DataTransferItemList): "audio" | "midi" | null {
  if (!items.length) return null;
  const item = items[0];
  if (item.kind !== "file") return null;
  const mime = item.type.toLowerCase();
  const entry = item.webkitGetAsEntry?.();
  const name = (entry?.name ?? "").toLowerCase();
  if (mime === "audio/midi" || mime === "audio/x-midi" || name.endsWith(".mid") || name.endsWith(".midi"))
    return "midi";
  if (mime.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/.test(name))
    return "audio";
  return null;
}

// T003: Detect file type from a File object (during ondrop — full filename available)
function detectFileTypeFromFile(file: File): "audio" | "midi" | null {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (mime === "audio/midi" || mime === "audio/x-midi" || name.endsWith(".mid") || name.endsWith(".midi"))
    return "midi";
  if (mime.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/.test(name))
    return "audio";
  return null;
}

// T004: Compute ghost clip position from a drag event
function computeGhostPosition(
  e: React.DragEvent<HTMLDivElement>,
  container: HTMLDivElement,
  tracks: Track[],
): { trackIndex: number; startMeasure: number } | null {
  if (tracks.length === 0) return null;
  const rect = container.getBoundingClientRect();
  const pixelY = e.clientY - rect.top;
  if (pixelY < RULER_HEIGHT) return null; // cursor over ruler — no valid track target
  const pixelX = e.clientX - rect.left + container.scrollLeft;
  const startMeasure = Math.max(1, Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4);
  const trackIndex = Math.max(0, Math.min(tracks.length - 1, Math.floor((pixelY - RULER_HEIGHT) / TRACK_HEIGHT)));
  return { trackIndex, startMeasure };
}

export function Timeline({
  tracks,
  clips,
  midiClips,
  bpm,
  playbackPosition,
  isPlaying,
  organizationId,
  editingTrackId,
  downloadUrls,
  onClipPositionChanged,
  onMidiClipPositionChanged,
  onVolumeChanged,
  onTrackDeleted,
  onClipUploaded,
  onMidiClipUploaded,
  onClipDeleted,
  onMidiClipDeleted,
  onClipRenamed,
  onEditingTrackIdChange,
  onTrackRenamed,
  onAddTrack,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingStartMeasureRef = useRef<number>(1);
  const draggingAudioRef = useRef<{
    clipId: string;
    startX: number;
    initialScrollLeft: number;
    originalMeasure: number;
  } | null>(null);
  const draggingMidiRef = useRef<{
    clipId: string;
    startX: number;
    initialScrollLeft: number;
    originalMeasure: number;
  } | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);
  const currentMouseXRef = useRef<number>(0);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const midiInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  // T002: Drag & drop ghost state
  type DragGhost = {
    trackIndex: number;
    startMeasure: number;
    fileType: "audio" | "midi";
    durationMs?: number;  // set after drop while upload is in progress
    uploading?: boolean;
  };
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const updateAudioPosition = trpc.organization.audioClip.updatePosition.useMutation();
  const updateMidiPosition = trpc.organization.midiClip.updatePosition.useMutation();
  const deleteTrack = trpc.organization.track.delete.useMutation();
  const renameTrack = trpc.organization.track.rename.useMutation();
  const renameClip = trpc.organization.audioClip.rename.useMutation();
  const getUploadUrl = trpc.organization.audioClip.getUploadUrl.useMutation();
  const registerClip = trpc.organization.audioClip.register.useMutation();
  const registerMidiClip = trpc.organization.midiClip.register.useMutation();
  const deleteClip = trpc.organization.audioClip.delete.useMutation();
  const deleteMidiClip = trpc.organization.midiClip.delete.useMutation();
  const setInstrumentPreset = trpc.organization.track.setInstrumentPreset.useMutation();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clip: AudioClip) => {
      e.preventDefault();
      if (!containerRef.current) return;

      draggingAudioRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      const computeMeasure = (mouseX: number, scrollLeft: number) => {
        const dx =
          mouseX -
          draggingAudioRef.current!.startX +
          scrollLeft -
          draggingAudioRef.current!.initialScrollLeft;
        const newMeasure = Math.max(
          1,
          draggingAudioRef.current!.originalMeasure + dx / PIXELS_PER_MEASURE,
        );
        return Math.round(newMeasure * 4) / 4;
      };

      const animate = () => {
        if (draggingAudioRef.current && containerRef.current && scrollSpeedRef.current !== 0) {
          containerRef.current.scrollLeft = Math.max(
            0,
            containerRef.current.scrollLeft + scrollSpeedRef.current,
          );
          const snapped = computeMeasure(
            currentMouseXRef.current,
            containerRef.current.scrollLeft,
          );
          onClipPositionChanged({ ...clip, startMeasure: snapped });
        }
        scrollAnimRef.current = requestAnimationFrame(animate);
      };
      scrollAnimRef.current = requestAnimationFrame(animate);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingAudioRef.current || !containerRef.current) return;
        currentMouseXRef.current = moveEvent.clientX;
        const rect = containerRef.current.getBoundingClientRect();
        const distLeft = moveEvent.clientX - rect.left;
        const distRight = rect.right - moveEvent.clientX;
        if (distLeft < SCROLL_THRESHOLD) {
          scrollSpeedRef.current = -SCROLL_MAX_SPEED * (1 - distLeft / SCROLL_THRESHOLD);
        } else if (distRight < SCROLL_THRESHOLD) {
          scrollSpeedRef.current = SCROLL_MAX_SPEED * (1 - distRight / SCROLL_THRESHOLD);
        } else {
          scrollSpeedRef.current = 0;
        }
        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        onClipPositionChanged({ ...clip, startMeasure: snapped });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingAudioRef.current || !containerRef.current) return;
        scrollSpeedRef.current = 0;
        if (scrollAnimRef.current !== null) {
          cancelAnimationFrame(scrollAnimRef.current);
          scrollAnimRef.current = null;
        }
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);
        updateAudioPosition.mutate(
          { clipId: clip.id, startMeasure: snapped },
          {
            onSuccess: (updated) => onClipPositionChanged(updated),
            onError: () =>
              onClipPositionChanged({ ...clip, startMeasure: draggingAudioRef.current!.originalMeasure }),
          },
        );
        draggingAudioRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onClipPositionChanged, updateAudioPosition],
  );

  const handleMidiMouseDown = useCallback(
    (e: React.MouseEvent, clip: MidiClip) => {
      e.preventDefault();
      if (!containerRef.current) return;

      draggingMidiRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      const computeMeasure = (mouseX: number, scrollLeft: number) => {
        const dx =
          mouseX -
          draggingMidiRef.current!.startX +
          scrollLeft -
          draggingMidiRef.current!.initialScrollLeft;
        const newMeasure = Math.max(1, draggingMidiRef.current!.originalMeasure + dx / PIXELS_PER_MEASURE);
        return Math.round(newMeasure * 4) / 4;
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingMidiRef.current || !containerRef.current) return;
        currentMouseXRef.current = moveEvent.clientX;
        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        onMidiClipPositionChanged({ ...clip, startMeasure: snapped });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingMidiRef.current || !containerRef.current) return;
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);
        updateMidiPosition.mutate(
          { clipId: clip.id, startMeasure: snapped },
          {
            onSuccess: (updated) => onMidiClipPositionChanged(updated),
            onError: () =>
              onMidiClipPositionChanged({ ...clip, startMeasure: draggingMidiRef.current!.originalMeasure }),
          },
        );
        draggingMidiRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onMidiClipPositionChanged, updateMidiPosition],
  );

  const handleUploadAudio = useCallback(
    async (trackId: string, file: File, startMeasure: number) => {
      const contentType = file.type || "audio/mpeg";
      const durationMs = await getAudioDurationMs(file);

      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
        organizationId,
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
        organizationId,
        startMeasure,
        durationMs,
      });

      onClipUploaded(clip);
    },
    [getUploadUrl, registerClip, onClipUploaded, organizationId],
  );

  const handleUploadMidi = useCallback(
    async (trackId: string, file: File, startMeasure: number) => {
      const contentType = "audio/midi";

      // Parse MIDI to get duration before uploading
      let durationMs: number | undefined;
      try {
        const { Midi } = await import("@tonejs/midi");
        const arrayBuffer = await file.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
      } catch {
        // skip duration if parsing fails
      }

      const { storageKey, uploadUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType,
        organizationId,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      const clip = await registerMidiClip.mutateAsync({
        trackId,
        filename: file.name,
        storageKey,
        organizationId,
        startMeasure,
        durationMs,
      });

      onMidiClipUploaded(clip);
    },
    [getUploadUrl, registerMidiClip, onMidiClipUploaded, organizationId],
  );

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      deleteTrack.mutate({ trackId }, { onSuccess: () => onTrackDeleted(trackId) });
    },
    [deleteTrack, onTrackDeleted],
  );

  const handleDeleteClip = useCallback(
    (clipId: string) => {
      deleteClip.mutate({ clipId }, { onSuccess: () => onClipDeleted(clipId) });
    },
    [deleteClip, onClipDeleted],
  );

  const handleDeleteMidiClip = useCallback(
    (clipId: string) => {
      deleteMidiClip.mutate({ clipId }, { onSuccess: () => onMidiClipDeleted(clipId) });
    },
    [deleteMidiClip, onMidiClipDeleted],
  );

  const handleRenameCommit = useCallback(
    (trackId: string, name: string, originalName: string) => {
      onEditingTrackIdChange(null);
      const trimmed = name.trim();
      if (trimmed && trimmed !== originalName) {
        renameTrack.mutate(
          { trackId, name: trimmed },
          { onSuccess: (updated) => onTrackRenamed(updated.id, updated.name) },
        );
      }
    },
    [renameTrack, onEditingTrackIdChange, onTrackRenamed],
  );

  // T005/T010: dragenter — activate drop zone indicator only (file parse happens in dragover)
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileType = detectFileTypeFromItems(e.dataTransfer.items);
    if (fileType) setIsDragActive(true);
  }, []);

  // T006/T011: dragover — update ghost position only (file content unavailable until drop)
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const fileType = detectFileTypeFromItems(e.dataTransfer.items);
      if (!fileType) {
        setDragGhost(null);
        return;
      }
      setIsDragActive(true);
      const pos = computeGhostPosition(e, containerRef.current, tracks);
      // Preserve durationMs/uploading fields if ghost already exists (set after drop)
      setDragGhost((prev) =>
        pos ? { ...prev, ...pos, fileType } : null,
      );
    },
    [tracks],
  );

  // T007: dragleave — only clear state when pointer actually leaves the container
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(e.relatedTarget as Node)) {
      setDragGhost(null);
      setIsDragActive(false);
    }
  }, []);

  // T008/T012/T015: drop — parse duration, keep ghost visible while uploading, clear when done
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (!containerRef.current || tracks.length === 0) { setDragGhost(null); return; }
      const file = e.dataTransfer.files[0];
      if (!file) { setDragGhost(null); return; }
      const fileType = detectFileTypeFromFile(file);
      if (!fileType) { setDragGhost(null); return; }
      const pos = computeGhostPosition(e, containerRef.current, tracks);
      if (!pos || !tracks[pos.trackIndex]) { setDragGhost(null); return; }

      // Parse duration now — file is accessible after drop
      let durationMs: number | undefined;
      if (fileType === "audio") {
        durationMs = await getAudioDurationMs(file);
      } else {
        try {
          const { Midi } = await import("@tonejs/midi");
          const midi = new Midi(await file.arrayBuffer());
          if (midi.duration > 0) durationMs = Math.round(midi.duration * 1000);
        } catch { /* leave undefined */ }
      }

      // Update ghost with real dimensions; keep it visible as a loading indicator
      setDragGhost({ ...pos, fileType, durationMs, uploading: true });

      try {
        const trackId = tracks[pos.trackIndex].id;
        if (fileType === "audio") {
          await handleUploadAudio(trackId, file, pos.startMeasure);
        } else {
          await handleUploadMidi(trackId, file, pos.startMeasure);
        }
      } finally {
        setDragGhost(null);
      }
    },
    [tracks, handleUploadAudio, handleUploadMidi],
  );

  // T017: dragend — clear ghost if drag is cancelled without a drop (e.g. Escape)
  const handleDragEnd = useCallback(() => {
    setDragGhost(null);
    setIsDragActive(false);
  }, []);

  const secondsPerMeasure = (4 * 60) / bpm;

  const totalMeasures = useMemo(() => {
    const lastAudioEnd = clips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs
        ? clip.durationMs / 1000 / secondsPerMeasure
        : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    const lastMidiEnd = midiClips.reduce((max, clip) => {
      const durationMeasures = clip.durationMs
        ? clip.durationMs / 1000 / secondsPerMeasure
        : 1;
      return Math.max(max, clip.startMeasure + durationMeasures);
    }, 0);
    return Math.max(MIN_MEASURES, Math.ceil(Math.max(lastAudioEnd, lastMidiEnd)) + BUFFER_MEASURES);
  }, [clips, midiClips, secondsPerMeasure]);

  const totalWidth = totalMeasures * PIXELS_PER_MEASURE;

  return (
    <div className="border rounded-lg overflow-hidden flex flex-row">
      {/* Left panel — fixed, no horizontal scroll */}
      <div className="flex-shrink-0 border-r" style={{ width: LEFT_PANEL_WIDTH }}>
        <div className="bg-muted border-b" style={{ height: RULER_HEIGHT }} />

        {tracks.map((track) => {
          const trackHasMidi = midiClips.some((c) => c.trackId === track.id);
          return (
            <ContextMenu key={track.id}>
              <ContextMenuTrigger asChild>
                <div
                  className="border-b px-2 flex flex-col justify-center gap-0.5"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <PhantomInput
                    defaultValue={track.name}
                    autoFocus={editingTrackId === track.id}
                    onFocus={() => onEditingTrackIdChange(track.id)}
                    onBlur={(e) => {
                      onEditingTrackIdChange(null);
                      handleRenameCommit(track.id, e.target.value, track.name);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") e.currentTarget.blur();
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <Slider
                      min={-60}
                      max={6}
                      step={0.1}
                      value={[track.volume]}
                      onValueChange={([v]) => onVolumeChanged(track.id, v)}
                      className="flex-1 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:rounded-sm"
                    />
                    <span className="text-xs text-muted-foreground w-14 text-right shrink-0">
                      {track.volume.toFixed(1)} dB
                    </span>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => handleDeleteTrack(track.id)}
                >
                  Delete track
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {/* Add-track placeholder */}
        <div
          className="flex items-center justify-center border-b border-dashed cursor-pointer hover:border-primary hover:text-primary text-muted-foreground transition-colors"
          style={{ height: TRACK_HEIGHT }}
          onClick={onAddTrack}
        >
          <span className="text-lg leading-none select-none">+</span>
        </div>
      </div>

      {/* Scrollable timeline — T014: ring when drop zone active; T005/T016: drag events only here, not on left panel */}
      <div
        className={cn("flex-1 overflow-x-auto min-w-0", isDragActive && "ring-2 ring-inset ring-primary/40")}
        ref={containerRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <div className="relative" style={{ width: totalWidth }}>
          {/* Ruler */}
          <div
            className="flex bg-muted border-b"
            style={{ height: RULER_HEIGHT }}
          >
            {Array.from({ length: totalMeasures }, (_, i) => (
              <div
                key={i}
                className="relative border-r border-border flex items-center px-1 shrink-0"
                style={{ width: PIXELS_PER_MEASURE }}
              >
                <span className="text-xs text-muted-foreground">{i + 1}</span>
                {[1, 2, 3].map((q) => (
                  <div
                    key={q}
                    className="absolute top-0 bottom-0 border-r border-border/20"
                    style={{ left: q * (PIXELS_PER_MEASURE / 4) }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Track lanes */}
          {tracks.map((track) => {
            const trackAudioClips = clips.filter((c) => c.trackId === track.id);
            const trackMidiClips = midiClips.filter((c) => c.trackId === track.id);
            return (
              <ContextMenu key={track.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className="relative border-b bg-background"
                    style={{ height: TRACK_HEIGHT }}
                    onContextMenu={(e) => {
                      if (!containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      const pixelX =
                        e.clientX - rect.left + containerRef.current.scrollLeft;
                      pendingStartMeasureRef.current = Math.max(
                        1,
                        Math.min(
                          totalMeasures,
                          Math.round((pixelX / PIXELS_PER_MEASURE) * 4) / 4 + 1,
                        ),
                      );
                    }}
                  >
                    {/* Grid lines */}
                    {Array.from({ length: totalMeasures * 4 }, (_, i) => {
                      const isMeasure = (i + 1) % 4 === 0;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "absolute top-0 bottom-0 border-r",
                            isMeasure ? "border-border/30" : "border-border/10",
                          )}
                          style={{ left: ((i + 1) * PIXELS_PER_MEASURE) / 4 }}
                        />
                      );
                    })}

                    {/* Audio clips */}
                    {trackAudioClips.map((clip) => (
                      <AudioClipView
                        key={clip.id}
                        clip={clip}
                        isEditing={editingClipId === clip.id}
                        downloadUrl={downloadUrls.get(clip.file.storageKey)}
                        secondsPerMeasure={secondsPerMeasure}
                        onMouseDown={handleMouseDown}
                        onEditStart={() => setEditingClipId(clip.id)}
                        onEditCommit={(name) => {
                          setEditingClipId(null);
                          const trimmed = name.trim();
                          const current = clip.name ?? stripExtension(clip.file.filename);
                          if (trimmed && trimmed !== current) {
                            renameClip.mutate(
                              { clipId: clip.id, name: trimmed },
                              {
                                onSuccess: (updated) =>
                                  onClipRenamed(updated.id, updated.name ?? stripExtension(updated.file.filename)),
                              },
                            );
                          }
                        }}
                        onDelete={() => handleDeleteClip(clip.id)}
                      />
                    ))}

                    {/* MIDI clips */}
                    {trackMidiClips.map((clip) => (
                      <MidiClipView
                        key={clip.id}
                        clip={clip}
                        downloadUrl={downloadUrls.get(clip.file.storageKey)}
                        secondsPerMeasure={secondsPerMeasure}
                        onMouseDown={handleMidiMouseDown}
                        onDelete={() => handleDeleteMidiClip(clip.id)}
                      />
                    ))}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={() => fileInputRefs.current.get(track.id)?.click()}
                  >
                    Upload audio
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => midiInputRefs.current.get(track.id)?.click()}
                  >
                    Upload MIDI
                  </ContextMenuItem>
                </ContextMenuContent>
                {/* Hidden audio file input per track */}
                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(track.id, el);
                    else fileInputRefs.current.delete(track.id);
                  }}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleUploadAudio(track.id, file, pendingStartMeasureRef.current);
                    e.target.value = "";
                  }}
                />
                {/* Hidden MIDI file input per track */}
                <input
                  ref={(el) => {
                    if (el) midiInputRefs.current.set(track.id, el);
                    else midiInputRefs.current.delete(track.id);
                  }}
                  type="file"
                  accept=".mid,.midi,audio/midi"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleUploadMidi(track.id, file, pendingStartMeasureRef.current);
                    e.target.value = "";
                  }}
                />
              </ContextMenu>
            );
          })}

          {tracks.length === 0 && (
            <div
              className="flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: TRACK_HEIGHT }}
            />
          )}

          {/* T009/T013: Ghost clip overlay — 2-measure default during drag, correct width after drop */}
          {dragGhost && (() => {
            const { durationMs, uploading } = dragGhost;
            const ghostWidth = durationMs
              ? Math.max(PIXELS_PER_MEASURE, (durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE)
              : PIXELS_PER_MEASURE * 2;
            const durationLabel = durationMs
              ? durationMs >= 60_000
                ? `${Math.floor(durationMs / 60_000)}m ${String(Math.floor((durationMs % 60_000) / 1000)).padStart(2, "0")}s`
                : `${(durationMs / 1000).toFixed(1)}s`
              : null;
            return (
              <div
                className={cn(
                  "absolute pointer-events-none border-2 rounded z-20 flex items-center px-1.5 overflow-hidden",
                  uploading ? "border-solid opacity-70 animate-pulse" : "border-dashed opacity-60",
                  dragGhost.fileType === "audio"
                    ? "border-primary bg-primary/20"
                    : "border-emerald-500 bg-emerald-500/20",
                )}
                style={{
                  left: (dragGhost.startMeasure - 1) * PIXELS_PER_MEASURE,
                  top: RULER_HEIGHT + dragGhost.trackIndex * TRACK_HEIGHT + 4,
                  width: ghostWidth,
                  height: TRACK_HEIGHT - 8,
                }}
              >
                {durationLabel && (
                  <span className="text-xs font-medium truncate leading-none">
                    {durationLabel}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Playback cursor */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-px pointer-events-none z-10",
              isPlaying ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ left: playbackPosition * PIXELS_PER_MEASURE }}
          />
        </div>
      </div>
    </div>
  );
}

interface AudioClipViewProps {
  clip: AudioClip;
  isEditing: boolean;
  downloadUrl: string | undefined;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: AudioClip) => void;
  onEditStart: () => void;
  onEditCommit: (name: string) => void;
  onDelete: () => void;
}

function AudioClipView({
  clip,
  isEditing,
  downloadUrl,
  secondsPerMeasure,
  onMouseDown,
  onEditStart,
  onEditCommit,
  onDelete,
}: AudioClipViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayName = clip.name ?? stripExtension(clip.file.filename);
  const clipWidth = Math.max(
    PIXELS_PER_MEASURE,
    clip.durationMs
      ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE
      : PIXELS_PER_MEASURE,
  );

  useEffect(() => {
    if (!downloadUrl || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(downloadUrl);
        const buf = await res.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(buf);
        await audioCtx.close();
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const data = decoded.getChannelData(0);
        const numBins = canvas.width;
        const samplesPerBin = Math.ceil(data.length / numBins);
        const mid = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(99,102,241,0.35)";
        for (let i = 0; i < numBins; i++) {
          let peak = 0;
          for (let j = 0; j < samplesPerBin; j++) {
            const idx = i * samplesPerBin + j;
            if (idx < data.length) peak = Math.max(peak, Math.abs(data[idx]));
          }
          const h = Math.max(1, peak * mid);
          ctx.fillRect(i, mid - h, 1, h * 2);
        }
      } catch {
        // skip clips that fail to decode
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [downloadUrl]);

  const handleExportClip = useCallback(() => {
    if (!downloadUrl) return;
    const ext = clip.file.filename.split(".").pop() ?? "mp3";
    const clipName = clip.name ?? stripExtension(clip.file.filename);
    fetch(downloadUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${clipName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      });
  }, [downloadUrl, clip]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="absolute top-1 bottom-1 rounded bg-primary/20 border border-primary/40 cursor-grab active:cursor-grabbing overflow-hidden select-none"
          style={{
            left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
            width: clipWidth,
          }}
          onMouseDown={(e) => onMouseDown(e, clip)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          title={clip.file.filename}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 px-2 h-full flex items-center">
            {isEditing ? (
              <PhantomInput
                defaultValue={displayName}
                autoFocus
                className="text-xs"
                onBlur={(e) => onEditCommit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.currentTarget.value = displayName;
                    e.currentTarget.blur();
                  }
                }}
              />
            ) : (
              <span className="text-xs truncate">{displayName}</span>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleExportClip} disabled={!downloadUrl}>
          Export clip
        </ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          Delete clip
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface MidiClipViewProps {
  clip: MidiClip;
  downloadUrl?: string;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: MidiClip) => void;
  onDelete: () => void;
}

function MidiClipView({ clip, downloadUrl, secondsPerMeasure, onMouseDown, onDelete }: MidiClipViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayName = clip.name ?? stripExtension(clip.file.filename);
  const clipWidth = Math.max(
    PIXELS_PER_MEASURE,
    clip.durationMs
      ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE
      : PIXELS_PER_MEASURE,
  );

  useEffect(() => {
    if (!downloadUrl || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(downloadUrl);
        const buf = await res.arrayBuffer();
        const { Midi } = await import("@tonejs/midi");
        const midi = new Midi(buf);
        if (cancelled || !canvasRef.current) return;

        const notes = midi.tracks.flatMap((t) => t.notes);
        const totalDuration = midi.duration;
        if (notes.length === 0 || totalDuration === 0) return;

        const minPitch = Math.min(...notes.map((n) => n.midi));
        const maxPitch = Math.max(...notes.map((n) => n.midi));
        const pitchRange = Math.max(1, maxPitch - minPitch);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(16,185,129,0.7)";

        const noteH = Math.max(1, canvas.height / (pitchRange + 1));
        for (const note of notes) {
          const x = (note.time / totalDuration) * canvas.width;
          const w = Math.max(1, (note.duration / totalDuration) * canvas.width);
          const normalizedPitch =
            minPitch === maxPitch ? 0.5 : (note.midi - minPitch) / pitchRange;
          const y = canvas.height - normalizedPitch * canvas.height - noteH;
          ctx.fillRect(x, y, w, noteH);
        }
      } catch {
        // silent: clip shows without preview
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [downloadUrl]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="absolute top-1 bottom-1 rounded bg-emerald-500/20 border border-emerald-500/40 cursor-grab active:cursor-grabbing overflow-hidden select-none flex items-center px-2"
          style={{
            left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
            width: clipWidth,
          }}
          onMouseDown={(e) => onMouseDown(e, clip)}
          title={clip.file.filename}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={clipWidth}
            height={TRACK_HEIGHT - 8}
          />
          <span className="relative z-10 text-xs truncate text-emerald-700 dark:text-emerald-300">
            ♩ {displayName}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          Delete clip
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
