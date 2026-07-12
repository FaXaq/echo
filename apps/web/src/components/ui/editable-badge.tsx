import * as React from "react";
import { cn } from "@/lib/utils";

interface EditableBadgeProps {
  label: string;
  value: string | number;
  onSave: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
}

export function EditableBadge({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  className,
}: EditableBadgeProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const startEditing = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) {
      onSave(draft);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
  };

  const base =
    "inline-flex items-center gap-1 rounded px-2.5 py-1 transition-all";

  if (editing) {
    return (
      <span
        className={cn(base, "bg-foreground/[0.06] border-b-2 border-b-primary", className)}
      >
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/40 text-[10px]">·</span>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className={cn(
            "bg-transparent border-none outline-none font-mono font-bold text-sm",
            type === "number" ? "w-14" : "w-24",
          )}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        base,
        "bg-foreground/[0.06] hover:bg-foreground/[0.09] border-b-2 border-b-transparent hover:border-b-primary/40 cursor-pointer",
        className,
      )}
    >
      <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">{label}</span>
      <span className="text-muted-foreground/40 text-[10px]">·</span>
      <span className="font-mono font-bold text-sm">
        {value !== "" && value != null ? value : (
          <span className="text-muted-foreground/50">{placeholder ?? "—"}</span>
        )}
      </span>
    </button>
  );
}
