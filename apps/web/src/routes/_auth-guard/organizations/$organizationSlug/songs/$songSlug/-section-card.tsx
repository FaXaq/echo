import { useState, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import type { ViewMode } from "./-view-mode-toggle";

type SongChord = {
  at: number;
  chord: string;
};

type Definition = {
  id: string;
  name: string;
  chords: SongChord[];
  lyrics: string | null;
  color: string | null;
};

export type SectionInstance = {
  id: string;
  songId: string;
  definitionId: string;
  startMeasure: number;
  lengthMeasures: number;
  lyricsOverride: string | null;
  definition: Definition;
};

type Props = {
  instance: SectionInstance;
  viewMode: ViewMode;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
};

function parseChordInput(raw: string): SongChord[] {
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [chord, atStr] = s.split("@");
      const at = atStr ? parseFloat(atStr) : 1.0;
      return { chord: chord.trim(), at: isNaN(at) ? 1.0 : at };
    })
    .filter(c => c.chord);
}

function chordsToInput(chords: SongChord[]): string {
  return chords.map(c => `${c.chord}@${c.at}`).join(", ");
}

const PRESET_COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#DB2777", "#0891B2", "#65A30D",
];

function colorForIndex(index: number): string {
  return PRESET_COLORS[index % PRESET_COLORS.length];
}

export function SectionCard({ instance, viewMode, dragging, onDragStart, onDragOver, onDrop }: Props) {
  const { t } = useTranslation("songs");
  const utils = trpc.useUtils();

  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsValue, setLyricsValue] = useState(
    instance.lyricsOverride ?? instance.definition.lyrics ?? ""
  );
  const [editingChords, setEditingChords] = useState(false);
  const [chordsValue, setChordsValue] = useState(
    chordsToInput(instance.definition.chords)
  );
  const [editingColor, setEditingColor] = useState(false);
  const lyricsRef = useRef<HTMLTextAreaElement>(null);

  const updateInstance = trpc.organization.song.section.instance.update.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId: instance.songId }),
  });
  const updateDefinition = trpc.organization.song.section.definition.update.useMutation({
    onSuccess: () => utils.organization.song.section.instance.list.invalidate({ songId: instance.songId }),
  });

  const hasOwnLyrics = instance.lyricsOverride !== null;
  const displayLyrics = instance.lyricsOverride ?? instance.definition.lyrics ?? "";
  const color = instance.definition.color ?? colorForIndex(0);

  function saveLyrics(value: string) {
    if (hasOwnLyrics) {
      updateInstance.mutate({ id: instance.id, lyricsOverride: value || null });
    } else {
      updateDefinition.mutate({ id: instance.definition.id, lyrics: value || null });
    }
    setEditingLyrics(false);
  }

  function handleLyricsClick() {
    if (!hasOwnLyrics && instance.definition.lyrics) {
      // Prompt handled inline via a small UI choice
    }
    setEditingLyrics(true);
    setLyricsValue(displayLyrics);
    setTimeout(() => lyricsRef.current?.focus(), 0);
  }

  function saveChords() {
    const parsed = parseChordInput(chordsValue);
    updateDefinition.mutate({ id: instance.definition.id, chords: parsed });
    setEditingChords(false);
  }

  function saveColor(hex: string) {
    updateDefinition.mutate({ id: instance.definition.id, color: hex });
    setEditingColor(false);
  }

  return (
    <div
      className={[
        "rounded-lg border border-border bg-card transition-opacity",
        dragging ? "opacity-40" : "",
      ].join(" ")}
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <button
          type="button"
          title={t("Change color")}
          className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0 cursor-pointer"
          style={{ background: color }}
          onClick={() => setEditingColor(v => !v)}
        />
        <span className="font-semibold text-sm">{instance.definition.name}</span>
        <span className="text-xs text-muted-foreground ml-1">
          {t("m{{start}}", { start: instance.startMeasure })}
        </span>
      </div>

      {/* Color picker */}
      {editingColor && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-b border-border">
          {PRESET_COLORS.map(hex => (
            <button
              key={hex}
              type="button"
              className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white transition-colors"
              style={{ background: hex }}
              onClick={() => saveColor(hex)}
            />
          ))}
        </div>
      )}

      <div className="px-4 py-3 space-y-2">
        {/* Chords row */}
        {(viewMode === "lyrics+chords" || viewMode === "chords") && (
          <div>
            {editingChords ? (
              <input
                autoFocus
                className="w-full text-sm font-mono bg-muted rounded px-2 py-1 outline-none border border-primary"
                value={chordsValue}
                onChange={e => setChordsValue(e.target.value)}
                onBlur={saveChords}
                onKeyDown={e => { if (e.key === "Enter") saveChords(); if (e.key === "Escape") setEditingChords(false); }}
                placeholder="Am@1.0, G@1.5, F@2.0, C@2.5"
              />
            ) : (
              <button
                type="button"
                className="text-sm font-mono text-left w-full text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setEditingChords(true); setChordsValue(chordsToInput(instance.definition.chords)); }}
              >
                {instance.definition.chords.length > 0
                  ? instance.definition.chords.map(c => c.chord).join("  —  ")
                  : <span className="italic">{t("Add chords…")}</span>
                }
              </button>
            )}
          </div>
        )}

        {/* Lyrics block */}
        {(viewMode === "lyrics+chords" || viewMode === "lyrics") && (
          <div>
            {editingLyrics ? (
              <div className="space-y-1">
                {!hasOwnLyrics && instance.definition.lyrics && (
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span><Trans t={t}>Editing canonical lyrics (affects all uses)</Trans></span>
                    <button
                      type="button"
                      className="underline text-primary"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        updateInstance.mutate({ id: instance.id, lyricsOverride: lyricsValue });
                        setEditingLyrics(false);
                      }}
                    >
                      <Trans t={t}>Override for this instance only</Trans>
                    </button>
                  </div>
                )}
                <textarea
                  ref={lyricsRef}
                  className="w-full text-sm bg-muted rounded px-2 py-1 outline-none border border-primary min-h-[80px] resize-y font-mono"
                  value={lyricsValue}
                  onChange={e => setLyricsValue(e.target.value)}
                  onBlur={() => saveLyrics(lyricsValue)}
                />
              </div>
            ) : (
              <button
                type="button"
                className="text-sm text-left w-full whitespace-pre-wrap text-foreground hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
                onClick={handleLyricsClick}
              >
                {displayLyrics || (
                  <span className="italic text-muted-foreground">{t("Add lyrics…")}</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
