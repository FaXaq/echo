import { useState, useRef } from "react";
import type React from "react";
import { GripVertical, X } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { trpc } from "@/lib/trpc";
import type { ViewMode } from "./-view-mode-toggle";
import type { RouterOutputs } from "@echo/api/router";

type SongChord = {
  at: number;
  chord: string;
};

type Props = {
  instance: RouterOutputs["organization"]["song"]["section"]["instance"]["list"][number];
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
        "group pl-4 py-2 transition-opacity border-l-[3px]",
        dragging ? "opacity-40" : "",
      ].join(" ")}
      style={{ borderLeftColor: color }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <div
          ref={handleRef}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title={t("Drag to reorder section")}
        >
          <GripVertical size={12} />
        </div>

        <button
          type="button"
          title={t("Change color")}
          className="w-2.5 h-2.5 rounded-full shrink-0 cursor-pointer ring-1 ring-inset ring-black/10"
          style={{ background: color }}
          onClick={() => setEditingColor(v => !v)}
        />

        {editingName ? (
          <input
            autoFocus
            className="font-mono font-bold text-sm bg-transparent outline-none min-w-0 flex-1 border-b border-b-current"
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
            className="font-mono font-bold text-sm cursor-text"
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
            className="font-mono text-[11px] bg-transparent outline-none w-10 text-right ml-auto text-muted-foreground border-b border-b-muted-foreground"
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
            className="font-mono text-[11px] text-muted-foreground/50 ml-auto cursor-text hover:text-muted-foreground transition-colors"
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
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all shrink-0"
            onClick={onDelete}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Color picker */}
      {editingColor && (
        <div className="flex gap-2 flex-wrap mb-2 pl-[18px]">
          {PRESET_COLORS.map(hex => (
            <button
              key={hex}
              type="button"
              className="w-5 h-5 rounded-full ring-1 ring-inset ring-black/10 hover:scale-110 transition-transform"
              style={{ background: hex }}
              onClick={() => saveColor(hex)}
            />
          ))}
        </div>
      )}

      {/* Body */}
      <div className="space-y-1.5 pl-[18px]">
        {/* Chords */}
        {(viewMode === "lyrics+chords" || viewMode === "chords") && (
          editingChords ? (
            <input
              autoFocus
              className="w-full text-sm font-mono bg-transparent outline-none border-b border-b-current py-0.5 text-foreground"
              style={{ borderBottomColor: color }}
              value={chordsValue}
              onChange={e => setChordsValue(e.target.value)}
              onBlur={saveChords}
              onKeyDown={e => { if (e.key === "Enter") saveChords(); if (e.key === "Escape") setEditingChords(false); }}
              placeholder="Am, G, F, C"
            />
          ) : (
            <button
              type="button"
              className="text-sm font-mono text-left w-full text-muted-foreground hover:text-foreground transition-colors py-0.5"
              onClick={() => { setEditingChords(true); setChordsValue(chordsToInput(instance.definition.chords)); }}
            >
              {instance.definition.chords.length > 0
                ? instance.definition.chords.map(c => c.chord).join("  ·  ")
                : <span className="italic text-muted-foreground/50">{t("Add chords…")}</span>
              }
            </button>
          )
        )}

        {/* Lyrics */}
        {(viewMode === "lyrics+chords" || viewMode === "lyrics") && (
          editingLyrics ? (
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
                className="w-full text-sm bg-transparent outline-none border-b py-0.5 min-h-18 resize-y leading-relaxed"
                style={{ borderBottomColor: color }}
                value={lyricsValue}
                onChange={e => setLyricsValue(e.target.value)}
                onBlur={() => saveLyrics(lyricsValue)}
              />
            </div>
          ) : (
            <button
              type="button"
              className="text-sm text-left w-full whitespace-pre-wrap text-foreground/80 hover:text-foreground transition-colors leading-relaxed py-0.5"
              onClick={handleLyricsClick}
            >
              {displayLyrics || (
                <span className="italic text-muted-foreground/50">{t("Add lyrics…")}</span>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
