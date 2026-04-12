import { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import type { SectionInstance } from "./-section-card";

const PRESET_COLORS = [
  "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#DB2777", "#0891B2", "#65A30D",
];

function colorForIndex(index: number): string {
  return PRESET_COLORS[index % PRESET_COLORS.length];
}

type Props = {
  existingDefinitions: SectionInstance["definition"][];
  onCreateNew: (name: string) => void;
  onAddInstance: (definitionId: string) => void;
  isPending: boolean;
};

export function AddSectionRow({ existingDefinitions, onCreateNew, onAddInstance, isPending }: Props) {
  const { t } = useTranslation("songs");
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  function open() {
    setIsOpen(true);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCreateNew() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onCreateNew(trimmed);
    setIsOpen(false);
    setInputValue("");
  }

  function handleAddInstance(defId: string) {
    onAddInstance(defId);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-20">
          <div className="px-3 py-2 border-b border-border">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleCreateNew();
                if (e.key === "Escape") setIsOpen(false);
              }}
              placeholder={t("Section name…")}
              className="w-full text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {existingDefinitions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                <Trans t={t}>Add instance of</Trans>
              </div>
              {existingDefinitions.map((def, i) => {
                const color = def.color ?? colorForIndex(i);
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => handleAddInstance(def.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span>{def.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={open}
        disabled={isPending}
        className="w-full rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3 px-4 py-3 text-muted-foreground disabled:opacity-50"
      >
        <span className="text-base leading-none font-medium">+</span>
        <span className="text-sm"><Trans t={t}>Add section</Trans></span>
      </button>
    </div>
  );
}
