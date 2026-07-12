import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { TRACK_HEIGHT } from "./-constants";
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
  const { clips, midiClips, downloadUrls, selection, pixelsPerMeasure } = useDawContext();
  const { t } = useTranslation("songs");
  const selectionCount = selection.audioClipIds.size + selection.midiClipIds.size;
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
                Math.round((pixelX / pixelsPerMeasure) * 4) / 4 + 1,
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
                style={{ left: ((i + 1) * pixelsPerMeasure) / 4 }}
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
              selectionCount={selectionCount}
              downloadUrl={downloadUrls.get(clip.file.storageKey)}
              secondsPerMeasure={secondsPerMeasure}
              onMouseDown={onAudioMouseDown}
              onEditStart={() => onEditClipStart(clip.id)}
              onEditCommit={(name) => onEditClipCommit(clip, name)}
              onDelete={() => {
                onDeleteClip(clip.id)
              }}
              onDeleteSelection={() => {
                onDeleteSelection()
              }}
            />
          ))}

          {/* MIDI clips */}
          {trackMidiClips.map((clip) => (
            <MidiClipView
              key={clip.id}
              clip={clip}
              isSelected={selection.midiClipIds.has(clip.id)}
              selectionCount={selectionCount}
              downloadUrl={downloadUrls.get(clip.file.storageKey)}
              secondsPerMeasure={secondsPerMeasure}
              onMouseDown={onMidiMouseDown}
              onDelete={() => {
                onDeleteMidiClip(clip.id)
              }}
              onDeleteSelection={() => {
                onDeleteSelection()
              }}
            />
          ))}

          {/* Overlap indicators */}
          {computeOverlaps([
            ...trackAudioClips.map((clip) => ({
              left: (clip.startMeasure - 1) * pixelsPerMeasure,
              width: Math.max(
                pixelsPerMeasure,
                clip.durationMs
                  ? (clip.durationMs / 1000 / secondsPerMeasure) * pixelsPerMeasure
                  : pixelsPerMeasure,
              ),
            })),
            ...trackMidiClips.map((clip) => ({
              left: (clip.startMeasure - 1) * pixelsPerMeasure,
              width: Math.max(
                pixelsPerMeasure,
                clip.durationMs
                  ? (clip.durationMs / 1000 / secondsPerMeasure) * pixelsPerMeasure
                  : pixelsPerMeasure,
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
        {selectionCount > 0 && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onDeleteSelection}
          >
            {selectionCount > 1 ? t("Delete {{count}} clips", { count: selectionCount }) : t("Delete clip")}
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => fileInputRef.current?.click()}>
          {t("Upload audio")}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => midiInputRef.current?.click()}>
          {t("Upload MIDI")}
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
