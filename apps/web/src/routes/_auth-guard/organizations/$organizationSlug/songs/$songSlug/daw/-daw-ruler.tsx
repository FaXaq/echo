import { RULER_HEIGHT } from "./-constants";
import { useDawContext } from "./-daw-context";

interface DawRulerProps {
  totalMeasures: number;
}

export function DawRuler({ totalMeasures }: DawRulerProps) {
  const { pixelsPerMeasure } = useDawContext();

  return (
    <div className="flex bg-muted border-b" style={{ height: RULER_HEIGHT }}>
      {Array.from({ length: totalMeasures }, (_, i) => (
        <div
          key={i}
          className="relative border-r border-border flex items-center px-1 shrink-0"
          style={{ width: pixelsPerMeasure }}
        >
          <span className="text-xs text-muted-foreground">{i + 1}</span>
          {[1, 2, 3].map((q) => (
            <div
              key={q}
              className="absolute top-0 bottom-0 border-r border-border/20"
              style={{ left: q * (pixelsPerMeasure / 4) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
