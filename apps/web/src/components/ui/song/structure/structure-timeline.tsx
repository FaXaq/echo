import type { ReactNode } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { useLingui } from "@lingui/react/macro";
import type { SongSection } from "@echo/modules/song/domain";

import { cn } from "@/lib/utils";
import { SORTABLE_SENSORS } from "./sortable-sensors";
import { SECTION_KIND_COLORS, sectionTint } from "./section-kind";

function InsertSlot({
  label,
  disabled,
  onInsert,
}: {
  label: string;
  disabled: boolean;
  onInsert: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onInsert}
      className="flex w-2 flex-none items-center justify-center overflow-hidden rounded-md text-base font-semibold text-muted-foreground opacity-0 transition-[width,opacity] outline-none hover:w-7 hover:bg-accent hover:opacity-100 focus-visible:w-7 focus-visible:bg-accent focus-visible:opacity-100"
    >
      +
    </button>
  );
}

export function StructureTimeline({
  sections,
  selectedId,
  onSelect,
  onReorder,
  insertDisabled,
  onInsertAt,
}: {
  sections: SongSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: SongSection[]) => void;
  insertDisabled: boolean;
  onInsertAt: (index: number) => void;
}) {
  const { t } = useLingui();

  return (
    <DragDropProvider
      sensors={SORTABLE_SENSORS}
      onDragEnd={(event) => {
        if (event.operation.canceled) return;
        const ids = sections.map((section) => section.id);
        const moved = move(ids, event);
        if (moved !== ids) onReorder(moved.map((id) => sections[ids.indexOf(id)]));
      }}
    >
      <div className="flex h-16 items-stretch">
        {sections.map((section, index) => {
          const selected = section.id === selectedId;
          const name = section.name;
          return (
            <SortableSection
              key={section.id}
              id={section.id}
              index={index}
              flex={section.bars.length * section.repeat}
            >
              <>
                <InsertSlot
                  label={t`Insert a section before ${name}`}
                  disabled={insertDisabled}
                  onInsert={() => onInsertAt(index)}
                />
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(section.id)}
                  className="flex min-w-0 flex-1 cursor-grab touch-none active:cursor-grabbing flex-col items-start justify-center gap-0.5 rounded-md px-2.5 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  style={{
                    background: sectionTint(section.kind, selected ? 38 : 18),
                    boxShadow: selected
                      ? `inset 0 0 0 2px ${SECTION_KIND_COLORS[section.kind]}`
                      : undefined,
                  }}
                >
                  <span className="w-full truncate text-[13px] font-semibold">{section.name}</span>
                  <span className="text-[11px] opacity-75 tabular-nums">
                    {section.repeat > 1 ? `×${section.repeat}` : section.bars.length}
                  </span>
                </button>
              </>
            </SortableSection>
          );
        })}
        <InsertSlot
          label={t`Insert a section at the end`}
          disabled={insertDisabled}
          onInsert={() => onInsertAt(sections.length)}
        />
      </div>
    </DragDropProvider>
  );
}

function SortableSection({
  id,
  index,
  flex,
  children,
}: {
  id: string;
  index: number;
  flex: number;
  children: ReactNode;
}) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "section",
    accept: "section",
  });

  return (
    <div
      ref={ref}
      className={cn("flex min-w-0 items-stretch", isDragging && "opacity-40")}
      style={{ flex: `${flex} 1 0` }}
    >
      {children}
    </div>
  );
}
