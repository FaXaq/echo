import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { GripVertical } from "lucide-react";
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

// ============================================================================
// NEW: Type definitions for advanced editing features (multi-file, selection, undo)
// ============================================================================

type DragLock = "horizontal" | "vertical" | null;

type ClipSelection = {
  audioClipIds: Set<string>;
  midiClipIds: Set<string>;
};

type SelectionRect = {
  startX: number;   // timeline-local pixel X at mousedown
  startY: number;
  currentX: number;
  currentY: number;
} | null;

type ClipDragState = {
  kind: "clip";
  clipId: string;
  clipType: "audio" | "midi";
  originTrackIndex: number;
  originStartMeasure: number;
  trackIndex: number;            // current track index (changes during vertical drag) — T019-T021
  anchorOffsetPx: number;       // cursor X offset from clip left edge at grab
  startX: number;               // cursor X at mousedown
  startY: number;               // cursor Y at mousedown — T019
  lock: DragLock;
  // For multi-clip drag: all selected clips and their origins
  coMovers: Array<{
    clipId: string;
    clipType: "audio" | "midi";
    originTrackIndex: number;
    originStartMeasure: number;
  }>;
};

type FileDragState = {
  kind: "file";
  trackIndex: number;
  startMeasure: number;
  fileType: "audio" | "midi";
  durationMs?: number;
  uploading?: boolean;
};

type TrackHeaderDragState = {
  kind: "track-header";
  sourceIndex: number;
  insertBeforeIndex: number | null;  // null = insert at end
};

type DragState = ClipDragState | FileDragState | TrackHeaderDragState | null;

export type MultiFileDropMode = "use-existing-tracks" | "create-new-tracks";

export type PendingMultiFileDrop = {
  files: File[];
  targetTrackIndex: number;
  targetStartMeasure: number;
} | null;

// ============================================================================

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
  // NEW: undo/redo callbacks from parent (Daw component)
  pushHistory?: (apiUndo: () => void) => void;
  undo?: () => void;
  redo?: () => void;
  // T009: Callback when multiple files are dropped
  onPendingMultiDrop?: (pending: PendingMultiFileDrop) => void;
  // T027: Callback to pass bottomDropZone flag to parent
  onBottomDropZoneChange?: (active: boolean) => void;
  // T027: Callback when single file dropped in bottom zone (needs new track)
  onBottomZoneDrop?: (file: File, startMeasure: number) => Promise<void>;
  // T024-T025: Callback when track header is reordered
  onTracksReordered?: (reorderedTracks: Track[]) => void;
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

// T028: Compute overlapping regions between clips
function computeOverlaps(clipRegions: Array<{ left: number; width: number }>): Array<{ left: number; width: number }> {
  if (clipRegions.length < 2) return [];

  const overlaps: Array<{ left: number; width: number }> = [];

  for (let i = 0; i < clipRegions.length; i++) {
    for (let j = i + 1; j < clipRegions.length; j++) {
      const clip1 = clipRegions[i];
      const clip2 = clipRegions[j];

      const left1 = clip1.left;
      const right1 = clip1.left + clip1.width;
      const left2 = clip2.left;
      const right2 = clip2.left + clip2.width;

      // Compute intersection: [max(left1, left2), min(right1, right2)]
      const overlapLeft = Math.max(left1, left2);
      const overlapRight = Math.min(right1, right2);

      // Only add if there's a positive overlap
      if (overlapLeft < overlapRight) {
        overlaps.push({
          left: overlapLeft,
          width: overlapRight - overlapLeft,
        });
      }
    }
  }

  return overlaps;
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
  onPendingMultiDrop,
  onBottomDropZoneChange,
  onBottomZoneDrop,
  onTracksReordered,
  pushHistory,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingStartMeasureRef = useRef<number>(1);
  const draggingAudioRef = useRef<{
    clipId: string;
    startX: number;
    startY: number;                    // T019: Y position at drag start
    initialScrollLeft: number;
    originalMeasure: number;
    originalTrackIndex: number;        // T019: Track index at drag start
    lock: DragLock;                    // T019: Direction lock ("horizontal" | "vertical" | null)
    currentTrackIndex: number;         // T020: Current track index during vertical drag
    coMovers: Array<{                  // T016: Co-movers for multi-clip drag
      clipId: string;
      clipType: "audio" | "midi";
      originTrackIndex: number;
      originStartMeasure: number;
    }>;
  } | null>(null);
  const draggingMidiRef = useRef<{
    clipId: string;
    startX: number;
    startY: number;                    // T019: Y position at drag start
    initialScrollLeft: number;
    originalMeasure: number;
    originalTrackIndex: number;        // T019: Track index at drag start
    lock: DragLock;                    // T019: Direction lock ("horizontal" | "vertical" | null)
    currentTrackIndex: number;         // T020: Current track index during vertical drag
    coMovers: Array<{                  // T016: Co-movers for multi-clip drag
      clipId: string;
      clipType: "audio" | "midi";
      originTrackIndex: number;
      originStartMeasure: number;
    }>;
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
  // T026: State for bottom drop zone (file drop below all tracks)
  const [bottomDropZone, setBottomDropZone] = useState(false);
  // T023-T025: State for track header dragging (reordering)
  const [trackHeaderDragState, setTrackHeaderDragState] = useState<{
    sourceIndex: number;
    startY: number;
    currentY: number;
    insertBeforeIndex: number | null;
  } | null>(null);

  // T014-T018: Clip selection state for multi-clip drag
  const [selectionRect, setSelectionRect] = useState<SelectionRect>(null);
  const [selection, setSelection] = useState<ClipSelection>({ audioClipIds: new Set(), midiClipIds: new Set() });

  // T026-T027: Notify parent when bottomDropZone changes
  useEffect(() => {
    onBottomDropZoneChange?.(bottomDropZone);
  }, [bottomDropZone, onBottomDropZoneChange]);

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
  const deleteManyAudioClips = trpc.organization.audioClip.deleteMany.useMutation();
  const deleteManyMidiClips = trpc.organization.midiClip.deleteMany.useMutation();
  const setInstrumentPreset = trpc.organization.track.setInstrumentPreset.useMutation();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, clip: AudioClip) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (!containerRef.current) return;

      // T019: Find track index for the clip
      const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
      if (trackIndex === -1) return;

      // T016: Populate coMovers if this clip is selected (multi-clip drag)
      const isClipSelected = selection.audioClipIds.has(clip.id);
      const coMovers = isClipSelected
        ? Array.from(selection.audioClipIds)
          .filter((id) => id !== clip.id)
          .map((id) => {
            const coClip = clips.find((c) => c.id === id);
            return coClip ? {
              clipId: coClip.id,
              clipType: "audio" as const,
              originTrackIndex: tracks.findIndex((t) => t.id === coClip.trackId),
              originStartMeasure: coClip.startMeasure,
            } : null;
          })
          .filter((c) => c !== null) as Array<{
            clipId: string;
            clipType: "audio";
            originTrackIndex: number;
            originStartMeasure: number;
          }>
        : [];

      draggingAudioRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        startY: e.clientY,                     // T019: Track Y coordinate
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
        originalTrackIndex: trackIndex,        // T019: Store original track
        lock: isClipSelected ? "horizontal" : null,  // T016: Set lock to horizontal for multi-clip drag
        currentTrackIndex: trackIndex,         // T019: Current track (same as original initially)
        coMovers,                              // T016: Include co-movers
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      // Track last callback values to avoid re-rendering when nothing changed
      let lastCallbackMeasure = clip.startMeasure;
      let lastCallbackTrackId = clip.trackId;

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
          if (snapped !== lastCallbackMeasure) {
            lastCallbackMeasure = snapped;
            onClipPositionChanged({ ...clip, startMeasure: snapped });
          }
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

        // T019: Direction lock detection — first axis to breach 5px threshold wins
        if (draggingAudioRef.current.lock === null) {
          const dx = Math.abs(moveEvent.clientX - draggingAudioRef.current.startX);
          const dy = Math.abs(moveEvent.clientY - draggingAudioRef.current.startY);

          if (dx > 5 && dx > dy) {
            draggingAudioRef.current.lock = "horizontal";
          } else if (dy > 5 && dy > dx) {
            draggingAudioRef.current.lock = "vertical";
          }
        }

        // T020: If vertical lock, compute target track from cursor Y
        if (draggingAudioRef.current.lock === "vertical") {
          const trackPixelY = moveEvent.clientY - rect.top - RULER_HEIGHT;
          const targetTrackIndex = Math.max(
            0,
            Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT))
          );
          draggingAudioRef.current.currentTrackIndex = targetTrackIndex;
        } else {
          // T022: Ensure horizontal lock continues to work as before
          draggingAudioRef.current.currentTrackIndex = draggingAudioRef.current.originalTrackIndex;
        }

        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        const targetTrackId = tracks[draggingAudioRef.current.currentTrackIndex]?.id ?? clip.trackId;

        // Only update if position or track actually changed to reduce flickering from excessive re-renders
        if (snapped !== lastCallbackMeasure || targetTrackId !== lastCallbackTrackId) {
          lastCallbackMeasure = snapped;
          lastCallbackTrackId = targetTrackId;
          onClipPositionChanged({ ...clip, startMeasure: snapped, trackId: targetTrackId });

          // T017: Update visual positions of co-movers during drag (so they move with the primary clip)
          const deltaMeasures = snapped - draggingAudioRef.current.originalMeasure;
          draggingAudioRef.current.coMovers.forEach((coMover) => {
            const coMoverNewMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            const coMoverTrackId = tracks[coMover.originTrackIndex]?.id;
            if (coMoverTrackId) {
              if (coMover.clipType === "audio") {
                const coClip = clips.find((c) => c.id === coMover.clipId);
                if (coClip) {
                  onClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
                }
              } else {
                const coClip = midiClips.find((c) => c.id === coMover.clipId);
                if (coClip) {
                  onMidiClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
                }
              }
            }
          });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingAudioRef.current || !containerRef.current) return;
        scrollSpeedRef.current = 0;
        if (scrollAnimRef.current !== null) {
          cancelAnimationFrame(scrollAnimRef.current);
          scrollAnimRef.current = null;
        }
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);

        // T021: Check if moved to a different track (vertical lock)
        const dragState = draggingAudioRef.current;
        const newTrackId = tracks[dragState.currentTrackIndex]?.id;
        const movedToNewTrack = dragState.lock === "vertical" && dragState.currentTrackIndex !== dragState.originalTrackIndex && newTrackId;

        // T017: Handle co-movers (multi-clip drag) — update all selected clips in parallel
        const hasCoMovers = dragState.coMovers.length > 0;
        if (hasCoMovers && dragState.lock === "horizontal") {
          // Compute delta measures from origin for the primary clip
          const deltaMeasures = snapped - dragState.originalMeasure;

          // Build array of mutations for all co-movers
          const coMoverMutations = dragState.coMovers.map((coMover) => {
            const newCoMoverMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            return { coMover, newStartMeasure: newCoMoverMeasure };
          });

          // Fire mutations in parallel using Promise.allSettled
          Promise.allSettled(
            coMoverMutations.map(({ coMover, newStartMeasure }) => {
              return new Promise<void>((resolve, reject) => {
                if (coMover.clipType === "audio") {
                  updateAudioPosition.mutate(
                    { clipId: coMover.clipId, startMeasure: newStartMeasure },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    },
                  );
                } else {
                  updateMidiPosition.mutate(
                    { clipId: coMover.clipId, startMeasure: newStartMeasure },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    },
                  );
                }
              });
            }),
          ).then((results) => {
            const failures = results.filter((r) => r.status === "rejected");
            if (failures.length === 0) {
              // All co-mover mutations succeeded
              // Push single undo entry covering all co-mover updates
              pushHistory?.(() => {
                // Undo: restore all co-movers to original positions
                dragState.coMovers.forEach((coMover) => {
                  if (coMover.clipType === "audio") {
                    updateAudioPosition.mutate({
                      clipId: coMover.clipId,
                      startMeasure: coMover.originStartMeasure,
                    });
                  } else {
                    updateMidiPosition.mutate({
                      clipId: coMover.clipId,
                      startMeasure: coMover.originStartMeasure,
                    });
                  }
                });
              });
            }
          });
        }

        // Update primary clip (with or without track move)
        updateAudioPosition.mutate(
          {
            clipId: clip.id,
            startMeasure: snapped,
            ...(movedToNewTrack && { trackId: newTrackId }),  // T021: Include trackId if moved
          },
          {
            onSuccess: (updated) => {
              // T024: Push undo entry for cross-track move
              if (movedToNewTrack) {
                pushHistory?.(() => {
                  // Undo: restore to original track
                  updateAudioPosition.mutate({
                    clipId: clip.id,
                    startMeasure: snapped,
                    trackId: clip.trackId,
                  });
                });
              }
              onClipPositionChanged(updated);
            },
            onError: () => {
              const originalTrackId = tracks[dragState.originalTrackIndex]?.id ?? clip.trackId;
              onClipPositionChanged({
                ...clip,
                startMeasure: dragState.originalMeasure,
                trackId: originalTrackId,
              });
            },
          },
        );
        draggingAudioRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onClipPositionChanged, updateAudioPosition, tracks, pushHistory, selection, clips],
  );

  const handleMidiMouseDown = useCallback(
    (e: React.MouseEvent, clip: MidiClip) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (!containerRef.current) return;

      // T019: Find track index for the clip
      const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
      if (trackIndex === -1) return;

      // T016: Populate coMovers if this clip is selected (multi-clip drag)
      const isClipSelected = selection.midiClipIds.has(clip.id);
      const coMovers = isClipSelected
        ? Array.from(selection.midiClipIds)
          .filter((id) => id !== clip.id)
          .map((id) => {
            const coClip = midiClips.find((c) => c.id === id);
            return coClip ? {
              clipId: coClip.id,
              clipType: "midi" as const,
              originTrackIndex: tracks.findIndex((t) => t.id === coClip.trackId),
              originStartMeasure: coClip.startMeasure,
            } : null;
          })
          .filter((c) => c !== null) as Array<{
            clipId: string;
            clipType: "midi";
            originTrackIndex: number;
            originStartMeasure: number;
          }>
        : [];

      draggingMidiRef.current = {
        clipId: clip.id,
        startX: e.clientX,
        startY: e.clientY,                     // T019: Track Y coordinate
        initialScrollLeft: containerRef.current.scrollLeft,
        originalMeasure: clip.startMeasure,
        originalTrackIndex: trackIndex,        // T019: Store original track
        lock: isClipSelected ? "horizontal" : null,  // T016: Set lock to horizontal for multi-clip drag
        currentTrackIndex: trackIndex,         // T019: Current track (same as original initially)
        coMovers,                              // T016: Include co-movers
      };
      currentMouseXRef.current = e.clientX;
      scrollSpeedRef.current = 0;

      // Track last callback values to avoid re-rendering when nothing changed
      let lastCallbackMeasure = clip.startMeasure;
      let lastCallbackTrackId = clip.trackId;

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

        // T019: Direction lock detection — first axis to breach 5px threshold wins
        if (draggingMidiRef.current.lock === null) {
          const dx = Math.abs(moveEvent.clientX - draggingMidiRef.current.startX);
          const dy = Math.abs(moveEvent.clientY - draggingMidiRef.current.startY);

          if (dx > 5 && dx > dy) {
            draggingMidiRef.current.lock = "horizontal";
          } else if (dy > 5 && dy > dx) {
            draggingMidiRef.current.lock = "vertical";
          }
        }

        // T020: If vertical lock, compute target track from cursor Y
        if (draggingMidiRef.current.lock === "vertical") {
          const rect = containerRef.current.getBoundingClientRect();
          const trackPixelY = moveEvent.clientY - rect.top - RULER_HEIGHT;
          const targetTrackIndex = Math.max(
            0,
            Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT))
          );
          draggingMidiRef.current.currentTrackIndex = targetTrackIndex;
        } else {
          // T022: Ensure horizontal lock continues to work as before
          draggingMidiRef.current.currentTrackIndex = draggingMidiRef.current.originalTrackIndex;
        }

        const snapped = computeMeasure(moveEvent.clientX, containerRef.current.scrollLeft);
        const targetTrackId = tracks[draggingMidiRef.current.currentTrackIndex]?.id ?? clip.trackId;

        // Only update if position or track actually changed to reduce flickering from excessive re-renders
        if (snapped !== lastCallbackMeasure || targetTrackId !== lastCallbackTrackId) {
          lastCallbackMeasure = snapped;
          lastCallbackTrackId = targetTrackId;
          onMidiClipPositionChanged({ ...clip, startMeasure: snapped, trackId: targetTrackId });

          // T017: Update visual positions of co-movers during drag (so they move with the primary clip)
          const deltaMeasures = snapped - draggingMidiRef.current.originalMeasure;
          draggingMidiRef.current.coMovers.forEach((coMover) => {
            const coMoverNewMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            const coMoverTrackId = tracks[coMover.originTrackIndex]?.id;
            if (coMoverTrackId) {
              if (coMover.clipType === "audio") {
                const coClip = clips.find((c) => c.id === coMover.clipId);
                if (coClip) {
                  onClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
                }
              } else {
                const coClip = midiClips.find((c) => c.id === coMover.clipId);
                if (coClip) {
                  onMidiClipPositionChanged({ ...coClip, startMeasure: coMoverNewMeasure, trackId: coMoverTrackId });
                }
              }
            }
          });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!draggingMidiRef.current || !containerRef.current) return;
        const snapped = computeMeasure(upEvent.clientX, containerRef.current.scrollLeft);

        // T021: Check if moved to a different track (vertical lock)
        const dragState = draggingMidiRef.current;
        const newTrackId = tracks[dragState.currentTrackIndex]?.id;
        const movedToNewTrack = dragState.lock === "vertical" && dragState.currentTrackIndex !== dragState.originalTrackIndex && newTrackId;

        // T017: Handle co-movers (multi-clip drag) — update all selected clips in parallel
        const hasCoMovers = dragState.coMovers.length > 0;
        if (hasCoMovers && dragState.lock === "horizontal") {
          // Compute delta measures from origin for the primary clip
          const deltaMeasures = snapped - dragState.originalMeasure;

          // Build array of mutations for all co-movers
          const coMoverMutations = dragState.coMovers.map((coMover) => {
            const newCoMoverMeasure = Math.max(1, coMover.originStartMeasure + deltaMeasures);
            return { coMover, newStartMeasure: newCoMoverMeasure };
          });

          // Fire mutations in parallel using Promise.allSettled
          Promise.allSettled(
            coMoverMutations.map(({ coMover, newStartMeasure }) => {
              return new Promise<void>((resolve, reject) => {
                if (coMover.clipType === "audio") {
                  updateAudioPosition.mutate(
                    { clipId: coMover.clipId, startMeasure: newStartMeasure },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    },
                  );
                } else {
                  updateMidiPosition.mutate(
                    { clipId: coMover.clipId, startMeasure: newStartMeasure },
                    {
                      onSuccess: () => resolve(),
                      onError: (err) => reject(err),
                    },
                  );
                }
              });
            }),
          ).then((results) => {
            const failures = results.filter((r) => r.status === "rejected");
            if (failures.length === 0) {
              // All co-mover mutations succeeded
              // Push single undo entry covering all co-mover updates
              pushHistory?.(() => {
                // Undo: restore all co-movers to original positions
                dragState.coMovers.forEach((coMover) => {
                  if (coMover.clipType === "audio") {
                    updateAudioPosition.mutate({
                      clipId: coMover.clipId,
                      startMeasure: coMover.originStartMeasure,
                    });
                  } else {
                    updateMidiPosition.mutate({
                      clipId: coMover.clipId,
                      startMeasure: coMover.originStartMeasure,
                    });
                  }
                });
              });
            }
          });
        }

        // Update primary clip (with or without track move)
        updateMidiPosition.mutate(
          {
            clipId: clip.id,
            startMeasure: snapped,
            ...(movedToNewTrack && { trackId: newTrackId }),  // T021: Include trackId if moved
          },
          {
            onSuccess: (updated) => {
              // T024: Push undo entry for cross-track move
              if (movedToNewTrack) {
                pushHistory?.(() => {
                  // Undo: restore to original track
                  updateMidiPosition.mutate({
                    clipId: clip.id,
                    startMeasure: snapped,
                    trackId: clip.trackId,
                  });
                });
              }
              onMidiClipPositionChanged(updated);
            },
            onError: () => {
              const originalTrackId = tracks[dragState.originalTrackIndex]?.id ?? clip.trackId;
              onMidiClipPositionChanged({
                ...clip,
                startMeasure: dragState.originalMeasure,
                trackId: originalTrackId,
              });
            },
          },
        );
        draggingMidiRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onMidiClipPositionChanged, updateMidiPosition, tracks, pushHistory, selection, midiClips],
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

  const handleDeleteSelection = useCallback(() => {
    const audioIds = Array.from(selection.audioClipIds);
    const midiIds = Array.from(selection.midiClipIds);
    setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });
    const promises: Promise<unknown>[] = [];
    if (audioIds.length > 0) {
      promises.push(
        deleteManyAudioClips
          .mutateAsync({ clipIds: audioIds })
          .then(() => audioIds.forEach((id) => onClipDeleted(id))),
      );
    }
    if (midiIds.length > 0) {
      promises.push(
        deleteManyMidiClips
          .mutateAsync({ clipIds: midiIds })
          .then(() => midiIds.forEach((id) => onMidiClipDeleted(id))),
      );
    }
    Promise.allSettled(promises);
  }, [selection, deleteManyAudioClips, deleteManyMidiClips, onClipDeleted, onMidiClipDeleted]);

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
        setBottomDropZone(false);
        return;
      }
      setIsDragActive(true);

      // T026: Detect if cursor is below the last track (bottom drop zone)
      const rect = containerRef.current.getBoundingClientRect();
      const pixelY = e.clientY - rect.top;
      const lastTrackBottomY = RULER_HEIGHT + tracks.length * TRACK_HEIGHT;

      if (pixelY > lastTrackBottomY) {
        // Cursor is below all tracks — show "Create new track" drop zone
        setBottomDropZone(true);
        setDragGhost(null);
      } else {
        // Cursor is over a track — show ghost clip
        setBottomDropZone(false);
        const pos = computeGhostPosition(e, containerRef.current, tracks);
        // Preserve durationMs/uploading fields if ghost already exists (set after drop)
        setDragGhost((prev) =>
          pos ? { ...prev, ...pos, fileType } : null,
        );
      }
    },
    [tracks],
  );

  // T007: dragleave — only clear state when pointer actually leaves the container
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (!containerRef.current.contains(e.relatedTarget as Node)) {
      setDragGhost(null);
      setIsDragActive(false);
      setBottomDropZone(false);
    }
  }, []);

  // T008/T012/T015: drop — parse duration, keep ghost visible while uploading, clear when done
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      if (!containerRef.current || tracks.length === 0) { setDragGhost(null); setBottomDropZone(false); return; }
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) { setDragGhost(null); setBottomDropZone(false); return; }

      // Check if drop is in bottom zone (before clearing state)
      const rect = containerRef.current.getBoundingClientRect();
      const pixelY = e.clientY - rect.top;
      const lastTrackBottomY = RULER_HEIGHT + tracks.length * TRACK_HEIGHT;
      const isBottomZoneDrop = pixelY > lastTrackBottomY;
      setBottomDropZone(false);

      // T009: Detect multiple files; if > 1, notify parent instead of importing
      if (files.length > 1) {
        // If dropped in bottom zone, automatically create new tracks (no modal)
        if (isBottomZoneDrop) {
          // Trigger track creation for each file independently (don't await)
          files.forEach((file) => {
            onBottomZoneDrop?.(file, 1); // Each file creates a new track at measure 1
          });
          setDragGhost(null);
          return;
        }

        // Otherwise, show modal to ask user for import mode
        const pos = computeGhostPosition(e, containerRef.current, tracks);
        if (!pos) { setDragGhost(null); return; }
        // Call parent callback with pending multi-file drop
        onPendingMultiDrop?.({
          files,
          targetTrackIndex: pos.trackIndex,
          targetStartMeasure: pos.startMeasure,
        });
        setDragGhost(null);
        return;
      }

      // Single file: proceed with existing logic
      const file = files[0];
      const fileType = detectFileTypeFromFile(file);
      if (!fileType) { setDragGhost(null); return; }
      const pos = computeGhostPosition(e, containerRef.current, tracks);

      // T027: Check if dropped in bottom zone (below all tracks)
      if (!pos) {
        // Dropped below all tracks — notify parent to create new track
        try {
          await onBottomZoneDrop?.(file, 1); // Start at measure 1
        } finally {
          setDragGhost(null);
        }
        return;
      }

      if (!tracks[pos.trackIndex]) { setDragGhost(null); return; }

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
    [tracks, handleUploadAudio, handleUploadMidi, onBottomZoneDrop],
  );

  // T017: dragend — clear ghost if drag is cancelled without a drop (e.g. Escape)
  const handleDragEnd = useCallback(() => {
    setDragGhost(null);
    setIsDragActive(false);
  }, []);

  // Calculate secondsPerMeasure before it's used in handlers
  const secondsPerMeasure = (4 * 60) / bpm;

  // T023-T025: Track header drag initiation, movement, and completion
  const handleTrackHeaderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, sourceIndex: number) => {
      // Only allow drag from the grip icon area
      const target = e.target as HTMLElement;
      if (!target.closest("[data-drag-handle]")) return;

      e.preventDefault();
      setTrackHeaderDragState({
        sourceIndex,
        startY: e.clientY,
        currentY: e.clientY,
        insertBeforeIndex: sourceIndex,
      });

      // Add global mousemove and mouseup listeners for track header reordering
      const handleTrackHeaderMouseMove = (moveEvent: MouseEvent) => {
        setTrackHeaderDragState((prev) => {
          if (!prev) return null;
          const newY = moveEvent.clientY;

          // Calculate which track row the cursor is over
          // Account for ruler height and track height
          const trackPixelY = newY - (containerRef.current?.getBoundingClientRect().top ?? 0) - RULER_HEIGHT;
          const hoverTrackIndex = Math.max(
            0,
            Math.min(tracks.length - 1, Math.floor(trackPixelY / TRACK_HEIGHT))
          );

          // Insertion point is the track we're hovering over (insert before it)
          const insertBeforeIndex = hoverTrackIndex;

          return {
            ...prev,
            currentY: newY,
            insertBeforeIndex,
          };
        });
      };

      const handleTrackHeaderMouseUp = () => {
        document.removeEventListener("mousemove", handleTrackHeaderMouseMove);
        document.removeEventListener("mouseup", handleTrackHeaderMouseUp);

        setTrackHeaderDragState((prev) => {
          if (!prev || prev.insertBeforeIndex === null) return null;

          // T024: Reorder tracks if the insertion point changed
          if (prev.insertBeforeIndex !== prev.sourceIndex) {
            const sourceIndex = prev.sourceIndex;
            const insertBeforeIndex = prev.insertBeforeIndex;
            const newTracks = [...tracks];
            const [movedTrack] = newTracks.splice(sourceIndex, 1);
            newTracks.splice(insertBeforeIndex, 0, movedTrack);

            // Call parent callback to update state and fire mutation
            onTracksReordered?.(newTracks);

            // T024: Push undo entry that restores original order
            pushHistory?.(() => {
              // Undo: restore original track order
              const undoTracks = [...newTracks];
              // Remove from the new position and put back at the original position
              const [undoMovedTrack] = undoTracks.splice(insertBeforeIndex, 1);
              undoTracks.splice(sourceIndex, 0, undoMovedTrack);
              onTracksReordered?.(undoTracks);
            });
          }

          // Clear the drag state
          return null;
        });
      };

      document.addEventListener("mousemove", handleTrackHeaderMouseMove);
      document.addEventListener("mouseup", handleTrackHeaderMouseUp);
    },
    [tracks, onTracksReordered, pushHistory],
  );

  // T014: Handle selection rect drawing on timeline background
  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Only start selection if clicking on the timeline background (not a clip)
      const target = e.target as HTMLElement;
      if (target.closest("[data-clip]")) return;

      // Clear existing selection when starting a new drag
      setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });

      // Track selection rect locally to avoid stale closure in mouseup
      let currentSelectionRect = {
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      };

      setSelectionRect(currentSelectionRect);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        currentSelectionRect = {
          ...currentSelectionRect,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
        };
        setSelectionRect(currentSelectionRect);
      };

      // T015: Compute intersecting clips on mouseup
      const handleMouseUp = () => {
        if (!containerRef.current) {
          setSelectionRect(null);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;

        // Compute selection rect bounds in timeline coordinates using the local tracking variable
        const selLeft = Math.min(currentSelectionRect.startX, currentSelectionRect.currentX) - rect.left + scrollLeft;
        const selRight = Math.max(currentSelectionRect.startX, currentSelectionRect.currentX) - rect.left + scrollLeft;
        const selTop = Math.min(currentSelectionRect.startY, currentSelectionRect.currentY) - rect.top;
        const selBottom = Math.max(currentSelectionRect.startY, currentSelectionRect.currentY) - rect.top;

        // Find clips that intersect the selection rect
        const audioClipIds = new Set<string>();
        const midiClipIds = new Set<string>();

        clips.forEach((clip) => {
          const clipLeft = (clip.startMeasure - 1) * PIXELS_PER_MEASURE;
          const durationMeasures = clip.durationMs
            ? clip.durationMs / 1000 / secondsPerMeasure
            : 1;
          const clipRight = clipLeft + durationMeasures * PIXELS_PER_MEASURE;
          const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
          const clipTop = RULER_HEIGHT + trackIndex * TRACK_HEIGHT;
          const clipBottom = clipTop + TRACK_HEIGHT;

          // Half-open interval check
          if (clipLeft < selRight && clipRight > selLeft && clipTop < selBottom && clipBottom > selTop) {
            audioClipIds.add(clip.id);
          }
        });

        midiClips.forEach((clip) => {
          const clipLeft = (clip.startMeasure - 1) * PIXELS_PER_MEASURE;
          const durationMeasures = clip.durationMs
            ? clip.durationMs / 1000 / secondsPerMeasure
            : 1;
          const clipRight = clipLeft + durationMeasures * PIXELS_PER_MEASURE;
          const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
          const clipTop = RULER_HEIGHT + trackIndex * TRACK_HEIGHT;
          const clipBottom = clipTop + TRACK_HEIGHT;

          // Half-open interval check
          if (clipLeft < selRight && clipRight > selLeft && clipTop < selBottom && clipBottom > selTop) {
            midiClipIds.add(clip.id);
          }
        });

        setSelection({ audioClipIds, midiClipIds });
        setSelectionRect(null);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [clips, midiClips, tracks, secondsPerMeasure],
  );

  // T018: Clear selection on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelection({ audioClipIds: new Set(), midiClipIds: new Set() });
        setSelectionRect(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <div className="flex-shrink-0 border-r relative" style={{ width: LEFT_PANEL_WIDTH }}>
        <div className="bg-muted border-b" style={{ height: RULER_HEIGHT }} />

        {tracks.map((track, trackIndex) => {
          const trackHasMidi = midiClips.some((c) => c.trackId === track.id);
          return (
            <ContextMenu key={track.id}>
              <ContextMenuTrigger asChild>
                <div
                  className="border-b px-2 flex flex-row items-center gap-2 select-none"
                  style={{ height: TRACK_HEIGHT }}
                >
                  {/* Grip handle for reordering */}
                  <div
                    data-drag-handle
                    className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                    onMouseDown={(e) => handleTrackHeaderMouseDown(e, trackIndex)}
                    title="Drag to reorder track"
                  >
                    <GripVertical size={16} />
                  </div>

                  {/* Track controls */}
                  <div className="flex flex-col justify-center gap-0.5 flex-1 min-w-0">
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

        {/* T023: Insertion indicator zone during track reorder drag */}
        {trackHeaderDragState && trackHeaderDragState.insertBeforeIndex !== null && (
          <div
            className="absolute left-0 right-0 border-t-4 border-primary bg-primary/10 pointer-events-none"
            style={{
              top: RULER_HEIGHT + (trackHeaderDragState.insertBeforeIndex * TRACK_HEIGHT),
              height: TRACK_HEIGHT * 0.4,
              marginTop: -(TRACK_HEIGHT * 0.2),
            }}
          />
        )}

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
        onMouseDown={handleTimelineMouseDown}
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
                        isSelected={selection.audioClipIds.has(clip.id)}
                        selectionCount={selection.audioClipIds.size + selection.midiClipIds.size}
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
                        onDeleteSelection={handleDeleteSelection}
                      />
                    ))}

                    {/* MIDI clips */}
                    {trackMidiClips.map((clip) => (
                      <MidiClipView
                        key={clip.id}
                        clip={clip}
                        isSelected={selection.midiClipIds.has(clip.id)}
                        selectionCount={selection.audioClipIds.size + selection.midiClipIds.size}
                        downloadUrl={downloadUrls.get(clip.file.storageKey)}
                        secondsPerMeasure={secondsPerMeasure}
                        onMouseDown={handleMidiMouseDown}
                        onDelete={() => handleDeleteMidiClip(clip.id)}
                        onDeleteSelection={handleDeleteSelection}
                      />
                    ))}

                    {/* T029: Overlap indicator overlays — show semi-transparent regions where clips overlap */}
                    {computeOverlaps([
                      ...trackAudioClips.map((clip) => ({
                        left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
                        width: Math.max(
                          PIXELS_PER_MEASURE,
                          clip.durationMs ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE : PIXELS_PER_MEASURE,
                        ),
                      })),
                      ...trackMidiClips.map((clip) => ({
                        left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
                        width: Math.max(
                          PIXELS_PER_MEASURE,
                          clip.durationMs ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE : PIXELS_PER_MEASURE,
                        ),
                      })),
                    ]).map((overlap, idx) => (
                      <div
                        key={`overlap-${idx}`}
                        className="absolute top-1 bottom-1 pointer-events-none bg-white/20 rounded"
                        style={{
                          left: overlap.left,
                          width: overlap.width,
                        }}
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

          {/* T026: Bottom drop zone indicator — appears when dragging file below last track */}
          {bottomDropZone && (
            <div
              className="relative border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center"
              style={{ height: TRACK_HEIGHT }}
            >
              <span className="text-sm font-medium text-primary">Drop to create new track</span>
            </div>
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

          {/* T014: Selection rect overlay during drag-to-select */}
          {selectionRect && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-5"
              style={{
                left: Math.min(selectionRect.startX, selectionRect.currentX) - (containerRef.current?.getBoundingClientRect().left ?? 0) + (containerRef.current?.scrollLeft ?? 0),
                top: Math.min(selectionRect.startY, selectionRect.currentY) - (containerRef.current?.getBoundingClientRect().top ?? 0),
                width: Math.abs(selectionRect.currentX - selectionRect.startX),
                height: Math.abs(selectionRect.currentY - selectionRect.startY),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface AudioClipViewProps {
  clip: AudioClip;
  isEditing: boolean;
  isSelected: boolean;
  selectionCount: number;
  downloadUrl: string | undefined;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: AudioClip) => void;
  onEditStart: () => void;
  onEditCommit: (name: string) => void;
  onDelete: () => void;
  onDeleteSelection: () => void;
}

function AudioClipView({
  clip,
  isEditing,
  isSelected,
  selectionCount,
  downloadUrl,
  secondsPerMeasure,
  onMouseDown,
  onEditStart,
  onEditCommit,
  onDelete,
  onDeleteSelection,
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
          data-clip
          className={cn(
            "absolute top-1 bottom-1 rounded bg-primary/20 border cursor-grab active:cursor-grabbing overflow-hidden select-none",
            isSelected
              ? "border-primary ring-2 ring-primary ring-inset"
              : "border-primary/40"
          )}
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
        {selectionCount > 1 ? (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDeleteSelection}
          >
            Delete {selectionCount} clips
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            Delete clip
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface MidiClipViewProps {
  clip: MidiClip;
  isSelected: boolean;
  selectionCount: number;
  downloadUrl?: string;
  secondsPerMeasure: number;
  onMouseDown: (e: React.MouseEvent, clip: MidiClip) => void;
  onDelete: () => void;
  onDeleteSelection: () => void;
}

function MidiClipView({ clip, isSelected, selectionCount, downloadUrl, secondsPerMeasure, onMouseDown, onDelete, onDeleteSelection }: MidiClipViewProps) {
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
          data-clip
          className={cn(
            "absolute top-1 bottom-1 rounded bg-emerald-500/20 border cursor-grab active:cursor-grabbing overflow-hidden select-none flex items-center px-2",
            isSelected
              ? "border-emerald-500 ring-2 ring-emerald-500 ring-inset"
              : "border-emerald-500/40"
          )}
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
        {selectionCount > 1 ? (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDeleteSelection}
          >
            Delete {selectionCount} clips
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDelete}
          >
            Delete clip
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
