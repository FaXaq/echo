import { useTranslation } from "react-i18next";

export type ViewMode = "lyrics+chords" | "lyrics" | "chords";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ value, onChange }: Props) {
  const { t } = useTranslation("songs");

  const options: { mode: ViewMode; label: string }[] = [
    { mode: "lyrics+chords", label: t("Lyrics + Chords") },
    { mode: "lyrics", label: t("Lyrics only") },
    { mode: "chords", label: t("Chords only") },
  ];

  return (
    <div className="inline-flex rounded-md border border-border overflow-hidden text-sm">
      {options.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={[
            "px-3 py-1.5 transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
