import { useState, useRef } from "react";
import type React from "react";
import { GripVertical } from "lucide-react";
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
  handleRef?: React.Ref<HTMLDivElement>;
  autoFocusName?: boolean;
  onDelete?: () => void;
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

export function SectionCard({ instance, viewMode, dragging, handleRef, autoFocusName, onDelete }: Props) {
  const { t } = useTranslation("songs");
  const utils = trpc.useUtils();

  const [editingName, setEditingName] = useState(!!autoFocusName);
  const [nameValue, setNameValue] = useState(instance.definition.name);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsValue, setLyricsValue] = useState(
    instance.lyricsOverride ?? instance.definition.lyrics ?? ""
  );
  const [editingChords, setEditingChords] = useState(false);
  const [chordsValue, setChordsValue] = useState(
    chordsToInput(instance.definition.chords)
  );
  const [editingColor, setEditingColor] = useState(false);
  const [editingLength, setEditingLength] = useState(false);
  const [lengthValue, setLengthValue] = useState(instance.lengthMeasures.toString());
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

  function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== instance.definition.name) {
      updateDefinition.mutate({ id: instance.definition.id, name: trimmed });
    }
    setEditingName(false);
  }

  function saveColor(hex: string) {
    updateDefinition.mutate({ id: instance.definition.id, color: hex });
    setEditingColor(false);
  }

  function saveLength() {
    const parsed = parseFloat(lengthValue);
    if (!isNaN(parsed) && parsed >= 0.25) {
      // Snap to 0.25 measure increments
      const snapped = Math.round(parsed * 4) / 4;
      if (snapped !== instance.lengthMeasures) {
        updateInstance.mutate({ id: instance.id, lengthMeasures: snapped });
      }
    }
    setEditingLength(false);
  }

  return (
    <div
      className={[
        "group rounded-lg border border-border bg-card transition-opacity",
        dragging ? "opacity-40" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg border-b"
        style={{
          background: `${color}26`,
          borderColor: `${color}40`,
        }}
      >
        <div
          ref={handleRef}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          title={t("Drag to reorder section")}
        >
          <GripVertical size={14} />
        </div>
        <button
          type="button"
          title={t("Change color")}
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 cursor-pointer"
          style={{ background: color }}
          onClick={() => setEditingColor(v => !v)}
        />
        {editingName ? (
          <input
            autoFocus
            className="font-bold text-sm bg-transparent outline-none min-w-0 flex-1"
            style={{ color }}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") { setEditingName(false); setNameValue(instance.definition.name); }
            }}
          />
        ) : (
          <span
            className="font-bold text-sm cursor-text"
            style={{ color }}
            onClick={() => { setEditingName(true); setNameValue(instance.definition.name); }}
          >
            {instance.definition.name}
          </span>
        )}
        {editingLength ? (
          <input
            autoFocus
            type="number"
            step="0.25"
            min="0.25"
            className="text-xs bg-transparent outline-none w-12 text-right ml-auto"
            value={lengthValue}
            onChange={e => setLengthValue(e.target.value)}
            onBlur={saveLength}
            onKeyDown={e => {
              if (e.key === "Enter") saveLength();
              if (e.key === "Escape") { setEditingLength(false); setLengthValue(instance.lengthMeasures.toString()); }
            }}
          />
        ) : (
          <span
            className="text-xs text-muted-foreground ml-auto cursor-text hover:text-foreground transition-colors"
            onClick={() => { setEditingLength(true); setLengthValue(instance.lengthMeasures.toString()); }}
            title={t("Click to edit length")}
          >
            {t("{{count}}m", { count: instance.lengthMeasures })}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            title={t("Remove section")}
            className="text-muted-foreground hover:text-destructive transition-colors text-xs px-1 rounded flex-shrink-0"
            onClick={onDelete}
          >
            ✕
          </button>
        )}
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
