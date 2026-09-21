import type * as React from "react";
import { cn } from "@/lib/utils";

export type DotMatrixProps = React.ComponentProps<"svg"> & {
  matrix: number[][];
  /** Gap between cells, as a fraction of one cell's size (0-1). Defaults to 0.15. */
  gap?: number;
};

const DEFAULT_GAP = 0.15;
const CELL_RADIUS = 0.1;

export function DotMatrix({ matrix, gap = DEFAULT_GAP, className, ...props }: DotMatrixProps) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${cols} ${rows}`}
      className={cn("size-full", className)}
      {...props}
    >
      {matrix.map((row, r) =>
        row.map((value, c) => (
          <rect
            key={`${r}-${c}`}
            x={c + gap / 2}
            y={r + gap / 2}
            width={1 - gap}
            height={1 - gap}
            rx={CELL_RADIUS}
            opacity={value === 0 ? 1 : value}
            className={value === 0 ? "fill-muted" : "fill-foreground"}
          />
        )),
      )}
    </svg>
  );
}
