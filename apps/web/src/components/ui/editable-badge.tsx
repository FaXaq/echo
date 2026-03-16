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

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-sm transition-colors";

  if (editing) {
    return (
      <span
        className={cn(pillBase, "border-primary bg-background", className)}
      >
        <span className="text-xs text-muted-foreground">{label}</span>
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
            "bg-transparent border-none outline-none font-medium",
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
        pillBase,
        "border-border bg-muted hover:border-primary hover:bg-muted/80 cursor-pointer",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">
        {value !== "" && value != null ? value : (
          <span className="text-muted-foreground italic">{placeholder ?? "—"}</span>
        )}
      </span>
    </button>
  );
}
