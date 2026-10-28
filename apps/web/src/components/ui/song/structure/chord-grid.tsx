import { useState, type ReactNode } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { Plus, Trash2 } from "lucide-react";
import { useLingui } from "@lingui/react/macro";
import {
  barLabel,
  barsToText,
  formatTimeSignature,
  textToBars,
  type Bar,
} from "@echo/modules/song/domain";

import { cn } from "@/lib/utils";
import { SORTABLE_SENSORS } from "./sortable-sensors";

const MAX_BARS = 256;
const CELL_BACKGROUND =
  "color-mix(in oklch, var(--section-color, var(--muted-foreground)) 10%, var(--background))";

function barText(bar: Bar) {
  const prefix = bar.time ? `(${formatTimeSignature(bar.time)}) ` : "";
  return `${prefix}${bar.chords.length ? bar.chords.join(" / ") : "N.C."}`;
}

function parseBar(bars: Bar[], index: number, text: string) {
  const result = textToBars(`${barsToText(bars.slice(0, index))} | ${text} |`);
  return result.ok && result.bars.length === index + 1 ? result.bars[index] : null;
}

export function ChordGrid({ bars, onChange }: { bars: Bar[]; onChange: (bars: Bar[]) => void }) {
  const { t } = useLingui();
  const [ids, setIds] = useState(() => bars.map(() => crypto.randomUUID()));
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  if (ids.length !== bars.length) setIds(bars.map(() => crypto.randomUUID()));
  const draftBar = editing && parseBar(bars, editing.index, editing.text);

  function commit() {
    if (!editing) return;
    if (draftBar) onChange(bars.map((bar, i) => (i === editing.index ? draftBar : bar)));
    setEditing(null);
  }

  function addBar() {
    const bar = { chords: [...(bars.at(-1)?.chords ?? [])] };
    setIds([...ids, crypto.randomUUID()]);
    onChange([...bars, bar]);
    setEditing({ index: bars.length, text: barText(bar) });
  }

  function removeBar(index: number) {
    setIds(ids.filter((_, i) => i !== index));
    onChange(bars.filter((_, i) => i !== index));
  }

  return (
    <DragDropProvider
      sensors={SORTABLE_SENSORS}
      onDragEnd={(event) => {
        if (event.operation.canceled) return;
        const moved = move(ids, event);
        if (moved === ids) return;
        setIds(moved);
        onChange(moved.map((id) => bars[ids.indexOf(id)]));
      }}
    >
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {bars.map((bar, index) => {
          const label = barLabel(bars, index);
          const number = index + 1;
          return (
            <SortableBar key={ids[index]} id={ids[index]} index={index}>
              <>
                <span className="pointer-events-none absolute top-1.5 left-2 z-10 text-[11px] text-muted-foreground tabular-nums">
                  {number}
                </span>
                {editing?.index === index ? (
                  <input
                    autoFocus
                    aria-label={t`Chords for bar ${number}`}
                    aria-invalid={!draftBar}
                    spellCheck={false}
                    className="w-full rounded-md bg-background p-2.5 text-center font-heading text-xl font-semibold ring-2 ring-(--section-color,var(--ring)) outline-none aria-invalid:ring-destructive"
                    value={editing.text}
                    onChange={(event) => setEditing({ index, text: event.target.value })}
                    onBlur={commit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commit();
                      if (event.key === "Escape") setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={t`Bar ${number}: ${label}`}
                      className="flex w-full cursor-grab touch-none active:cursor-grabbing items-center justify-center rounded-md p-2.5 text-center"
                      style={{ background: CELL_BACKGROUND }}
                      onClick={() => setEditing({ index, text: barText(bar) })}
                    >
                      <span className="font-heading text-xl font-semibold whitespace-nowrap">
                        {label}
                      </span>
                    </button>
                    <div className="absolute top-1 right-1 flex text-muted-foreground">
                      {bars.length > 1 && (
                        <button
                          type="button"
                          aria-label={t`Remove bar ${number}`}
                          className="rounded-sm p-1 hover:text-destructive"
                          onClick={() => removeBar(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            </SortableBar>
          );
        })}
        {bars.length < MAX_BARS && (
          <li className="flex min-h-18">
            <button
              type="button"
              aria-label={t`Add a bar`}
              className="flex w-full items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={addBar}
            >
              <Plus />
            </button>
          </li>
        )}
      </ol>
    </DragDropProvider>
  );
}

function SortableBar({ id, index, children }: { id: string; index: number; children: ReactNode }) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "bar",
    accept: "bar",
  });

  return (
    <li ref={ref} className={cn("relative flex min-h-18", isDragging && "opacity-40")}>
      {children}
    </li>
  );
}
