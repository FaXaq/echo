import { useLingui } from "@lingui/react/macro";
import { barLabel, type Bar } from "@echo/modules/song/domain";

export function ChordGrid({ bars }: { bars: Bar[] }) {
  const { t } = useLingui();

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {bars.map((_, index) => {
        const label = barLabel(bars, index);
        const number = index + 1;
        return (
          <li
            key={index}
            aria-label={t`Bar ${number}: ${label}`}
            className="relative flex min-h-18 items-center justify-center rounded-md p-2.5 text-center"
            style={{
              background:
                "color-mix(in oklch, var(--section-color, var(--muted-foreground)) 10%, var(--background))",
            }}
          >
            <span className="absolute top-1.5 left-2 text-[11px] text-muted-foreground tabular-nums">
              {number}
            </span>
            <span className="font-heading text-xl font-semibold whitespace-nowrap">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
