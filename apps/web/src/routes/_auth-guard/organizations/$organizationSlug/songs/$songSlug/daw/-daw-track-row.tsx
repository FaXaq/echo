import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { PIXELS_PER_MEASURE, TRACK_HEIGHT } from "./-constants";
import type { Track, AudioClip, MidiClip } from "./-daw-types";
import { useDawContext } from "./-daw-context";
import { AudioClipView } from "./-audio-clip-view";
import { MidiClipView } from "./-midi-clip-view";
import { computeOverlaps } from "./-clip-utils";

export interface DawTrackRowProps {
  track: Track;
  totalMeasures: number;
  secondsPerMeasure: number;
  editingClipId: string | null;
  selectedAudioClipIds: Set<string>;
  selectedMidiClipIds: Set<string>;
  selectionCount: number;
  pendingStartMeasureRef: React.MutableRefObject<number>;
  onAudioMouseDown: (e: React.MouseEvent, clip: AudioClip) => void;
  onMidiMouseDown: (e: React.MouseEvent, clip: MidiClip) => void;
  onEditClipStart: (clipId: string) => void;
  onEditClipCommit: (clip: AudioClip, name: string) => void;
  onDeleteClip: (clipId: string) => void;
  onDeleteMidiClip: (clipId: string) => void;
  onDeleteSelection: () => void;
  onUploadAudio: (trackId: string, file: File, startMeasure: number) => Promise<void>;
  onUploadMidi: (trackId: string, file: File, startMeasure: number) => Promise<void>;
}

export function DawTrackRow({
  track,
  totalMeasures,
  secondsPerMeasure,
  editingClipId,
  selectedAudioClipIds,
  selectedMidiClipIds,
  selectionCount,
  pendingStartMeasureRef,
  onAudioMouseDown,
  onMidiMouseDown,
  onEditClipStart,
  onEditClipCommit,
  onDeleteClip,
  onDeleteMidiClip,
  onDeleteSelection,
  onUploadAudio,
  onUploadMidi,
}: DawTrackRowProps) {
  const { clips, midiClips, downloadUrls } = useDawContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);

  const trackAudioClips = clips.filter((c) => c.trackId === track.id);
  const trackMidiClips = midiClips.filter((c) => c.trackId === track.id);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative border-b bg-background"
          style={{ height: TRACK_HEIGHT }}
          onContextMenu={(e) => {
            const container = e.currentTarget.closest(".overflow-x-auto") as HTMLElement | null;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const pixelX = e.clientX - rect.left + container.scrollLeft;
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
              isSelected={selectedAudioClipIds.has(clip.id)}
              selectionCount={selectionCount}
              downloadUrl={downloadUrls.get(clip.file.storageKey)}
              secondsPerMeasure={secondsPerMeasure}
              onMouseDown={onAudioMouseDown}
              onEditStart={() => onEditClipStart(clip.id)}
              onEditCommit={(name) => onEditClipCommit(clip, name)}
              onDelete={() => onDeleteClip(clip.id)}
              onDeleteSelection={onDeleteSelection}
            />
          ))}

          {/* MIDI clips */}
          {trackMidiClips.map((clip) => (
            <MidiClipView
              key={clip.id}
              clip={clip}
              isSelected={selectedMidiClipIds.has(clip.id)}
              selectionCount={selectionCount}
              downloadUrl={downloadUrls.get(clip.file.storageKey)}
              secondsPerMeasure={secondsPerMeasure}
              onMouseDown={onMidiMouseDown}
              onDelete={() => onDeleteMidiClip(clip.id)}
              onDeleteSelection={onDeleteSelection}
            />
          ))}

          {/* Overlap indicators */}
          {computeOverlaps([
            ...trackAudioClips.map((clip) => ({
              left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
              width: Math.max(
                PIXELS_PER_MEASURE,
                clip.durationMs
                  ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE
                  : PIXELS_PER_MEASURE,
              ),
            })),
            ...trackMidiClips.map((clip) => ({
              left: (clip.startMeasure - 1) * PIXELS_PER_MEASURE,
              width: Math.max(
                PIXELS_PER_MEASURE,
                clip.durationMs
                  ? (clip.durationMs / 1000 / secondsPerMeasure) * PIXELS_PER_MEASURE
                  : PIXELS_PER_MEASURE,
              ),
            })),
          ]).map((overlap, idx) => (
            <div
              key={`overlap-${idx}`}
              className="absolute top-1 bottom-1 pointer-events-none bg-white/20 rounded"
              style={{ left: overlap.left, width: overlap.width }}
            />
          ))}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => fileInputRef.current?.click()}>
          Upload audio
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => midiInputRef.current?.click()}>
          Upload MIDI
        </ContextMenuItem>
      </ContextMenuContent>

      {/* Hidden audio file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadAudio(track.id, file, pendingStartMeasureRef.current);
          e.target.value = "";
        }}
      />
      {/* Hidden MIDI file input */}
      <input
        ref={midiInputRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadMidi(track.id, file, pendingStartMeasureRef.current);
          e.target.value = "";
        }}
      />
    </ContextMenu>
  );
}
